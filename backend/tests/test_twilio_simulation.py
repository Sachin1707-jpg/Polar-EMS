"""
Tests for Twilio SMS Alert Integration in Polar EMS Simulation Engine
"""
import pytest
from unittest.mock import MagicMock, patch
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.twilio_service import TwilioService, mask_phone_number
from app.services.scenario_engine import ScenarioEngine, ScenarioConfig


def test_mask_phone_number():
    """Test phone number masking helper"""
    assert mask_phone_number("+16562554609") == "+16******4609"
    assert mask_phone_number("+919876543210") == "+91******3210"
    assert mask_phone_number("123") == "****"
    assert mask_phone_number(None) is None


def test_twilio_condition_evaluation():
    """Test condition priority: CRITICAL > WARNING > NORMAL"""
    service = TwilioService()

    # Normal result
    normal_res = {"alerts": []}
    assert service.evaluate_condition(normal_res) == "NORMAL"

    # Warning result
    warning_res = {"alerts": [{"severity": "warning", "title": "Low Wind"}]}
    assert service.evaluate_condition(warning_res) == "WARNING"

    # Critical result
    critical_res = {"alerts": [{"severity": "critical", "title": "Generator Failure"}]}
    assert service.evaluate_condition(critical_res) == "CRITICAL"

    # Multiple severity result (Critical + Warning) -> Priority is CRITICAL
    mixed_res = {
        "alerts": [
            {"severity": "warning", "title": "Low Wind"},
            {"severity": "critical", "title": "Generator Failure"},
            {"severity": "info", "title": "Turbine Peak"}
        ]
    }
    assert service.evaluate_condition(mixed_res) == "CRITICAL"


@patch("app.services.twilio_service.TwilioClient")
def test_sms_trigger_on_warning_and_critical(mock_twilio_client):
    """Test that WARNING and CRITICAL trigger SMS, while NORMAL does not"""
    # Mock twilio client response
    mock_messages = MagicMock()
    mock_msg_instance = MagicMock()
    mock_msg_instance.sid = "SM1234567890abcdef"
    mock_messages.create.return_value = mock_msg_instance
    mock_twilio_client.return_value.messages = mock_messages

    service = TwilioService()

    # Scenario 1: NORMAL
    normal_sim = {
        "scenario_id": "sim_norm_01",
        "scenario_name": "Normal Operation",
        "alerts": [],
        "summary": {"final_battery_soc_percent": 80.0},
        "timeline": [{"wind_generation_kw": 50, "diesel_generation_kw": 0, "load_kw": 40}]
    }
    res_norm = service.process_simulation_alert(normal_sim)
    assert res_norm["required"] is False
    assert res_norm["status"] == "not_required"
    assert res_norm["alert_level"] == "NORMAL"
    assert mock_messages.create.call_count == 0

    # Scenario 2: WARNING
    warning_sim = {
        "scenario_id": "sim_warn_01",
        "scenario_name": "Low Wind Storm",
        "alerts": [{"severity": "warning", "title": "Very Low Renewable Generation"}],
        "summary": {"final_battery_soc_percent": 30.0},
        "timeline": [{"wind_generation_kw": 5, "diesel_generation_kw": 60, "load_kw": 70}]
    }
    res_warn = service.process_simulation_alert(warning_sim)
    assert res_warn["required"] is True
    assert res_warn["status"] == "sent"
    assert res_warn["message_sid"] == "SM1234567890abcdef"
    assert res_warn["alert_level"] == "WARNING"
    assert mock_messages.create.call_count == 3  # 3 recipients configured

    # Verify SMS text contains scenario details
    sent_text = mock_messages.create.call_args[1]["body"]
    assert "POLAR EMS WARNING" in sent_text
    assert "Low Wind Storm" in sent_text

    # Scenario 3: CRITICAL
    critical_sim = {
        "scenario_id": "sim_crit_01",
        "scenario_name": "Generator Outage",
        "alerts": [{"severity": "critical", "title": "Generator Failure Detected"}],
        "summary": {"final_battery_soc_percent": 15.0},
        "timeline": [{"wind_generation_kw": 0, "diesel_generation_kw": 0, "load_kw": 80}]
    }
    res_crit = service.process_simulation_alert(critical_sim)
    assert res_crit["required"] is True
    assert res_crit["status"] == "sent"
    assert res_crit["alert_level"] == "CRITICAL"
    assert mock_messages.create.call_count == 6  # 3 from WARNING + 3 from CRITICAL


@patch("app.services.twilio_service.TwilioClient")
def test_deduplication_protection(mock_twilio_client):
    """Test deduplication prevents multiple SMS messages for identical events"""
    mock_messages = MagicMock()
    mock_msg_instance = MagicMock()
    mock_msg_instance.sid = "SM_DEDUP_123"
    mock_messages.create.return_value = mock_msg_instance
    mock_twilio_client.return_value.messages = mock_messages

    service = TwilioService()

    crit_sim = {
        "scenario_id": "sim_same_01",
        "scenario_name": "Grid Failure",
        "alerts": [{"severity": "critical", "title": "Blackout Risk"}],
        "summary": {"final_battery_soc_percent": 10.0},
        "timeline": []
    }

    # First run -> sends SMS
    res1 = service.process_simulation_alert(crit_sim)
    assert res1["status"] == "sent"
    assert mock_messages.create.call_count == 3  # 3 recipients

    # Second run with SAME simulation_id -> deduplicated
    res2 = service.process_simulation_alert(crit_sim)
    assert res2["required"] is False
    assert res2["status"] == "not_required"
    assert "Duplicate simulation execution" in res2["reason"]
    assert mock_messages.create.call_count == 3  # Call count remains 3!



@patch("app.services.twilio_service.TwilioClient")
def test_twilio_failure_graceful_handling(mock_twilio_client):
    """Test that Twilio API failure does not crash simulation and returns status: failed"""
    mock_messages = MagicMock()
    mock_messages.create.side_effect = Exception("Twilio API Connection Refused")
    mock_twilio_client.return_value.messages = mock_messages

    service = TwilioService()

    crit_sim = {
        "scenario_id": "sim_fail_01",
        "scenario_name": "Emergency Test",
        "alerts": [{"severity": "critical", "title": "Critical Battery Low"}],
        "summary": {"final_battery_soc_percent": 5.0},
        "timeline": []
    }

    res = service.process_simulation_alert(crit_sim)

    # Simulation alert processing should succeed gracefully with status='failed'
    assert res["required"] is True
    assert res["status"] == "failed"
    assert "Twilio Connection Error" in res["error"] or "Connection Refused" in res["error"]


def test_full_scenario_engine_integration():
    """Test integration between ScenarioEngine and TwilioService"""
    engine = ScenarioEngine()
    twilio = TwilioService()

    # Predefined Normal Scenario
    normal_cfg = engine.generate_predefined_scenario("normal_operation")
    normal_results = engine.simulate_scenario(normal_cfg)
    sms_norm = twilio.process_simulation_alert(normal_results)
    assert sms_norm["alert_level"] == "NORMAL"
    assert sms_norm["status"] == "not_required"

    # Predefined Generator Failure Scenario (CRITICAL)
    gen_fail_cfg = engine.generate_predefined_scenario("generator_failure")
    gen_fail_results = engine.simulate_scenario(gen_fail_cfg)
    sms_crit = twilio.process_simulation_alert(gen_fail_results)
    assert sms_crit["alert_level"] == "CRITICAL"
    assert sms_crit["required"] is True
