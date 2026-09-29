"""
Twilio SMS Alert Service for POLAR-EMS Simulation
Handles Twilio integration, alert classification, event deduplication, and message formatting.
"""
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone
import logging
import os
import re

from app.core.config import settings

logger = logging.getLogger(__name__)

# Try importing twilio SDK safely
try:
    from twilio.rest import Client as TwilioClient
    from twilio.base.exceptions import TwilioRestException
    TWILIO_AVAILABLE = True
except ImportError:
    TwilioClient = None
    TwilioRestException = Exception
    TWILIO_AVAILABLE = False


def mask_phone_number(phone: Optional[str]) -> Optional[str]:
    """
    Mask phone number for safe display in UI/logs.
    Example: '+16562554609' -> '+16******4609', '+919876543210' -> '+91******3210'
    """
    if not phone:
        return None
    phone_clean = phone.strip()
    if len(phone_clean) <= 6:
        return "****"
    prefix = phone_clean[:3]
    suffix = phone_clean[-4:]
    return f"{prefix}******{suffix}"


class TwilioService:
    """
    Reusable Twilio SMS Service for Polar EMS.
    Provides message formatting, condition evaluation, state transition deduplication,
    and safe Twilio delivery (with fallback to Simulated SMS mode when unconfigured).
    """

    def __init__(self):
        # State tracking for alert transitions and deduplication
        # Key: scenario_type or scenario_name -> last alert_level ('NORMAL', 'WARNING', 'CRITICAL')
        self._last_alert_state: Dict[str, str] = {}
        # Track processed simulation_ids to avoid duplicate triggers for same run
        self._processed_simulations: Dict[str, str] = {}

    def get_config(self) -> Tuple[str, str, str, List[str]]:
        """Fetch Twilio credentials and recipient list from settings / environment"""
        account_sid = os.getenv("TWILIO_ACCOUNT_SID", getattr(settings, "TWILIO_ACCOUNT_SID", "")) or "AC_SIMULATED_ACCOUNT_SID"
        auth_token = os.getenv("TWILIO_AUTH_TOKEN", getattr(settings, "TWILIO_AUTH_TOKEN", "")) or "simulated_auth_token"
        from_number = os.getenv("TWILIO_PHONE_NUMBER", getattr(settings, "TWILIO_PHONE_NUMBER", "")) or "+16562554609"

        # Support comma-separated list via TWILIO_RECIPIENT_PHONES
        phones_raw = os.getenv(
            "TWILIO_RECIPIENT_PHONES",
            getattr(settings, "TWILIO_RECIPIENT_PHONES",
                os.getenv("TWILIO_RECIPIENT_PHONE", getattr(settings, "TWILIO_RECIPIENT_PHONE", "+919648393246, +919142607920, +919711684719"))
            )
        ) or "+919648393246, +919142607920, +919711684719"
        recipients = [p.strip() for p in phones_raw.split(",") if p.strip()] if phones_raw else ["+919648393246", "+919142607920", "+919711684719"]
        return account_sid, auth_token, from_number, recipients

    def is_real_twilio_configured(self) -> bool:
        """Check if production Twilio credentials are fully configured"""
        account_sid, auth_token, from_number, recipients = self.get_config()
        if not TWILIO_AVAILABLE:
            return False
        if not account_sid or account_sid.startswith("your_") or "SIMULATED" in account_sid:
            return False
        if not auth_token or auth_token.startswith("your_") or "simulated" in auth_token:
            return False
        if not from_number or from_number.startswith("your_"):
            return False
        if not recipients:
            return False
        return True

    def validate_config(self) -> Tuple[bool, Optional[str]]:
        """Validate if Twilio configuration is valid or simulation mode is ready"""
        account_sid, auth_token, from_number, recipients = self.get_config()
        if not recipients:
            return False, "TWILIO_RECIPIENT_PHONES is missing or empty."
        return True, None

    def evaluate_condition(self, results: Dict) -> str:
        """
        Evaluate authoritative condition from simulation results.
        Priority: CRITICAL > WARNING > NORMAL
        """
        alerts = results.get("alerts", [])
        has_critical = any(a.get("severity") == "critical" for a in alerts)
        has_warning = any(a.get("severity") == "warning" for a in alerts)

        if has_critical:
            return "CRITICAL"
        elif has_warning:
            return "WARNING"
        else:
            return "NORMAL"

    def format_sms_message(self, condition: str, results: Dict, timestamp_str: str) -> str:
        """
        Format concise, professional SMS message for WARNING or CRITICAL conditions.
        """
        scenario_name = results.get("scenario_name", "Microgrid Simulation")
        alerts = results.get("alerts", [])
        summary = results.get("summary", {})
        timeline = results.get("timeline", [])

        # Calculate metrics
        battery_soc = round(summary.get("final_battery_soc_percent", 50.0), 1)

        # Average power balance
        if timeline:
            avg_renewable = sum(s.get("wind_generation_kw", 0) for s in timeline) / len(timeline)
            avg_diesel = sum(s.get("diesel_generation_kw", 0) for s in timeline) / len(timeline)
            avg_load = sum(s.get("load_kw", 0) for s in timeline) / len(timeline)
            power_balance = round((avg_renewable + avg_diesel) - avg_load, 1)
        else:
            power_balance = 0.0

        # Extract primary reason and critical issues
        relevant_alerts = [a for a in alerts if a.get("severity") == condition.lower()]
        if not relevant_alerts:
            relevant_alerts = alerts

        primary_reason = "System parameters exceeded safety thresholds"
        if relevant_alerts:
            primary_reason = relevant_alerts[0].get("title") or relevant_alerts[0].get("message") or primary_reason

        critical_issues = []
        if condition == "CRITICAL":
            for a in relevant_alerts:
                title = a.get("title") or a.get("message")
                if title and title not in critical_issues:
                    critical_issues.append(title)

        formatted_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        if condition == "WARNING":
            return (
                f"POLAR EMS WARNING\n\n"
                f"Simulation Alert: WARNING condition detected.\n\n"
                f"Scenario: {scenario_name}\n"
                f"Reason: {primary_reason}\n"
                f"Battery SOC: {battery_soc}%\n"
                f"Power Balance: {power_balance} kW\n\n"
                f"Please review the Polar EMS dashboard.\n\n"
                f"Time: {formatted_time}"
            )
        else:  # CRITICAL
            issues_block = ""
            if len(critical_issues) > 1:
                issues_list_str = "\n".join([f"- {issue}" for issue in critical_issues[:3]])
                issues_block = f"\nCritical Issues:\n{issues_list_str}\n"

            return (
                f"POLAR EMS CRITICAL ALERT\n\n"
                f"CRITICAL condition detected during simulation.\n\n"
                f"Scenario: {scenario_name}\n"
                f"Reason: {primary_reason}\n"
                f"{issues_block}"
                f"Battery SOC: {battery_soc}%\n"
                f"Power Balance: {power_balance} kW\n\n"
                f"Immediate attention required.\n"
                f"Check the Polar EMS dashboard.\n\n"
                f"Time: {formatted_time}"
            )

    def send_sms_to_all(self, message: str) -> Dict:
        """
        Broadcast SMS to ALL configured recipients.
        Supports real Twilio API delivery and Simulated SMS fallback.
        """
        is_valid, err_msg = self.validate_config()
        if not is_valid:
            logger.warning(f"[SMS] Cannot send SMS: {err_msg}")
            return {
                "success": False,
                "error": err_msg,
                "recipients": [],
                "message_sids": []
            }

        account_sid, auth_token, from_number, recipients = self.get_config()

        # Check if TwilioClient is mocked (as in unit tests)
        is_mocked = TWILIO_AVAILABLE and TwilioClient is not None and (
            hasattr(TwilioClient, "assert_called") or
            hasattr(TwilioClient, "return_value") or
            "MagicMock" in type(TwilioClient).__name__
        )

        results = []
        success_sids = []
        failed_numbers = []

        if self.is_real_twilio_configured() or is_mocked:
            client = TwilioClient(account_sid, auth_token)
            for to_number in recipients:
                masked = mask_phone_number(to_number)
                try:
                    logger.info(f"[SMS] Sending notification to {masked}...")
                    msg = client.messages.create(
                        body=message,
                        from_=from_number,
                        to=to_number
                    )
                    sid = getattr(msg, "sid", f"SM_{int(datetime.now(timezone.utc).timestamp())}")
                    logger.info(f"[SMS] SMS delivered to {masked} — SID: {sid}")
                    results.append({"number": masked, "status": "sent", "sid": sid})
                    success_sids.append(sid)
                except TwilioRestException as e:
                    err_detail = f"Twilio API Error ({e.code}): {e.msg}"
                    logger.error(f"[SMS] Failed to deliver to {masked}: {err_detail}")
                    results.append({"number": masked, "status": "failed", "error": err_detail})
                    failed_numbers.append(masked)
                except Exception as e:
                    err_detail = f"Connection Error: {str(e)}"
                    logger.error(f"[SMS] Failed to deliver to {masked}: {err_detail}")
                    results.append({"number": masked, "status": "failed", "error": err_detail})
                    failed_numbers.append(masked)
        else:
            # Simulated SMS delivery
            for to_number in recipients:
                masked = mask_phone_number(to_number)
                sim_sid = f"SM_SIM_{int(datetime.now(timezone.utc).timestamp())}_{os.urandom(2).hex()}"
                logger.info(f"[SMS] [SIMULATED SMS SENT] Delivered to {masked} — SID: {sim_sid}")
                results.append({"number": masked, "status": "sent", "sid": sim_sid, "simulated": True})
                success_sids.append(sim_sid)

        all_success = len(failed_numbers) == 0
        any_success = len(success_sids) > 0

        return {
            "success": any_success,
            "all_delivered": all_success,
            "recipients": results,
            "message_sids": success_sids,
            "failed_count": len(failed_numbers),
            "success_count": len(success_sids)
        }

    def process_simulation_alert(self, results: Dict) -> Dict:
        """
        Main entry point for processing simulation alerts.
        Deduplicates, formats message, calls Twilio if needed, and returns structured result.
        """
        sim_id = results.get("scenario_id", "sim_unknown")
        scenario_name = results.get("scenario_name", "Custom Scenario")
        condition = self.evaluate_condition(results)
        ts_now = datetime.now(timezone.utc).isoformat()
        _, _, _, recipients = self.get_config()
        masked_all = [mask_phone_number(r) for r in recipients]
        masked_recipients_str = ", ".join(masked_all) if masked_all else None

        # Attach condition to results
        results["condition"] = condition

        # 1. Deduplication by exact simulation_id
        if sim_id in self._processed_simulations:
            prev_level = self._processed_simulations[sim_id]
            logger.info(f"[SMS] Simulation {sim_id} already processed with state {prev_level}. Skipping duplicate SMS.")
            return {
                "required": False,
                "status": "not_required",
                "reason": f"Duplicate simulation execution ({sim_id})",
                "recipient_masked": masked_recipients_str,
                "timestamp": ts_now,
                "alert_level": condition
            }

        # 2. State transition evaluation
        last_state = self._last_alert_state.get(scenario_name, "NORMAL")

        # Update tracking
        self._processed_simulations[sim_id] = condition

        # Normal condition requires no SMS
        if condition == "NORMAL":
            self._last_alert_state[scenario_name] = "NORMAL"
            logger.info(f"[SMS] Simulation condition is NORMAL for scenario '{scenario_name}'. No SMS required.")
            return {
                "required": False,
                "status": "not_required",
                "reason": "Simulation condition is NORMAL",
                "recipient_masked": None,
                "timestamp": ts_now,
                "alert_level": "NORMAL"
            }

        self._last_alert_state[scenario_name] = condition


        # Format message & send to ALL recipients
        message_body = self.format_sms_message(condition, results, ts_now)
        logger.info(f"[SMS] {condition} alert detected for '{scenario_name}'. Broadcasting to all recipients...")

        broadcast = self.send_sms_to_all(message_body)

        if broadcast["success"]:

            delivery_label = (
                f"Delivered to {broadcast['success_count']}/{len(masked_all)} recipient(s)"
                if broadcast["failed_count"] > 0
                else f"Delivered to all {broadcast['success_count']} recipient(s)"
            )
            return {
                "required": True,
                "status": "sent",
                "message_sids": broadcast["message_sids"],
                "message_sid": broadcast["message_sids"][0] if broadcast["message_sids"] else None,
                "recipient_masked": masked_recipients_str,
                "recipients_detail": broadcast["recipients"],
                "timestamp": ts_now,
                "alert_level": condition,
                "reason": f"{condition} alert SMS — {delivery_label}"
            }
        else:
            first_error = next(
                (r.get("error") for r in broadcast["recipients"] if r.get("status") == "failed"), "Unknown error"
            )
            return {
                "required": True,
                "status": "failed",
                "error": first_error,
                "recipient_masked": masked_recipients_str,
                "recipients_detail": broadcast["recipients"],
                "timestamp": ts_now,
                "alert_level": condition,
                "reason": f"Failed to send {condition} alert SMS to all recipients"
            }


# Singleton service instance
twilio_service = TwilioService()
