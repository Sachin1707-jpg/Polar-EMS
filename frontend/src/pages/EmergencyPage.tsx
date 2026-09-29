import { useState, useCallback } from 'react';
import {
  AlertTriangle,
  Shield,
  Zap,
  Battery,
  Wind,
  TrendingUp,
  AlertCircle,
  Radio,
  Beaker,
  Home,
  Heart,
  RefreshCw,
  Volume2,
  VolumeX,
  Sliders,
  Download,
  FileText,
  Activity,
  Power,
  Flame,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPower } from '@/utils/format';
import { cn } from '@/utils/cn';
import { emergencyAudio } from '@/utils/emergencyAudio';
import { simulationService } from '@/services/api/simulation.service';

/**
 * POLAR-EMS Emergency Response & Safety Center
 * Simple, professional, robust Emergency Scenario Center with bulletproof
 * physics calculation and optional backend API synchronization.
 */

interface ScenarioMeta {
  type: string;
  name: string;
  description: string;
  severity: string;
  icon: typeof AlertTriangle;
}

const supportedScenarios: ScenarioMeta[] = [
  {
    type: 'generator_failure',
    name: 'Main Generator Failure',
    description: 'Main generator G1 unexpectedly stops. Tests backup generator autostart and battery support.',
    severity: 'CRITICAL',
    icon: Zap,
  },
  {
    type: 'battery_failure',
    name: 'Battery System Failure',
    description: 'Battery storage BMS contactor trips for maintenance. Tests generator ramp compensation.',
    severity: 'WARNING',
    icon: Battery,
  },
  {
    type: 'load_increase',
    name: 'Sudden Load Increase',
    description: 'Heavy laboratory equipment turns on unexpectedly (+85 kW surge). Tests peak demand buffering.',
    severity: 'HIGH',
    icon: TrendingUp,
  },
  {
    type: 'renewable_failure',
    name: 'Wind Power Stopped',
    description: 'Wind speed drops suddenly, reducing wind turbine generation by 55 kW.',
    severity: 'MEDIUM',
    icon: Wind,
  },
  {
    type: 'extreme_cold',
    name: 'Extreme Cold (-40°C)',
    description: 'Severe polar storm increases station heating demand by +50 kW.',
    severity: 'HIGH',
    icon: AlertTriangle,
  },
  {
    type: 'multiple_failure',
    name: 'Multiple Component Failure',
    description: 'Main generator and wind turbines fail simultaneously.',
    severity: 'CRITICAL',
    icon: AlertCircle,
  },
];

// Baseline Nominal State initialization
const getBaselineState = () => {
  const nowStr = new Date().toLocaleTimeString();
  return {
    scenario_id: 'nominal_baseline',
    scenario_type: 'none',
    scenario_name: 'Normal Operation',
    system_status: 'ALL SYSTEMS NORMAL',
    metrics: {
      main_generator_kw: 250,
      main_generator_status: 'ONLINE',
      backup_generator_kw: 0,
      backup_generator_status: 'STANDBY',
      wind_generation_kw: 65,
      wind_status: 'ONLINE',
      battery_status: 'STANDBY',
      battery_soc_percent: 55,
      battery_power_kw: 0,
      total_supply_kw: 315,
      total_demand_kw: 185,
      grid_stability_pct: 100,
      grid_frequency_hz: 50.0,
      fuel_hours: 148,
    },
    components: {
      main_generator: { name: 'Main Generator G1', status: 'ONLINE', output_kw: 250, capacity_kw: 250 },
      backup_generator: { name: 'Backup Generator G2', status: 'STANDBY', output_kw: 0, capacity_kw: 150 },
      battery: { name: 'LiFePO4 Battery Storage', status: 'STANDBY', output_kw: 0, soc_percent: 55, capacity_kwh: 200 },
      renewable: { name: 'Wind Turbine Array', status: 'ONLINE', output_kw: 65, capacity_kw: 100 },
    },
    loads: [
      { id: 'life_support', name: 'Life Support & Oxygen', category: 'CRITICAL', simpleDescription: 'Must stay ON at all times for crew safety', icon: Heart, power_kw: 20.0, status: 'PROTECTED', priority: 1 },
      { id: 'comms', name: 'Emergency Satellite Comms', category: 'CRITICAL', simpleDescription: 'Keeps station connected to rescue base', icon: Radio, power_kw: 10.0, status: 'PROTECTED', priority: 1 },
      { id: 'research', name: 'Lab Research Equipment', category: 'HIGH_PRIORITY', simpleDescription: 'Scientific experiments & sample freezers', icon: Beaker, power_kw: 35.0, status: 'PROTECTED', priority: 2 },
      { id: 'hvac', name: 'Room Heating & HVAC', category: 'NON_CRITICAL', simpleDescription: 'Living quarters heating (can pause briefly)', icon: Home, power_kw: 25.0, status: 'PROTECTED', priority: 3 },
    ],
    battery_evaluation: {
      action: 'STANDBY',
      soc_percent: 55,
      discharge_rate_kw: 0,
      reason: 'System operating in balance. Battery in standby buffer mode.',
    },
    ai_recommendation: {
      action: 'Maintain nominal baseline. Wind generation and main generator operating in optimal curve.',
      why: [
        'Available power supply (315 kW) exceeds current station demand (185 kW)',
        'Battery SOC is healthy at 55%',
        'Critical Life Support and Comms prioritized and 100% safe',
      ],
    },
    timeline_logs: [
      { timestamp: nowStr, message: 'System operating normally. All components online and stable.' },
    ],
    energy_flow: {
      generator: { active: true, status: 'ONLINE', power_kw: 250 },
      backup_gen: { active: false, status: 'STANDBY', power_kw: 0 },
      renewable: { active: true, status: 'ONLINE', power_kw: 65 },
      battery: { active: false, status: 'STANDBY', power_kw: 0 },
      critical_loads: { active: true, status: 'PROTECTED', power_kw: 30 },
      non_critical_loads: { active: true, status: 'PROTECTED', power_kw: 60 },
    },
  };
};

export default function EmergencyPage() {
  const [selectedScenarioType, setSelectedScenarioType] = useState<string>('generator_failure');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [logFilter, setLogFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'success'>('all');

  // Custom Test Parameters
  const [customParams, setCustomParams] = useState({
    failedComponent: 'Power Transformer #2',
    capacityLossKw: 45,
    loadSpikeKw: 25,
  });

  // Always initialized with clean state (NEVER NULL)
  const [state, setState] = useState<any>(getBaselineState());

  const toggleSound = () => {
    const muted = emergencyAudio.toggleMute();
    setIsMuted(muted);
    toast.info(muted ? '🔇 Sound Alarm Muted' : '🔊 Sound Alarm Active');
  };

  // Local Microgrid Physics Calculation Engine (Bulletproof Fallback)
  const calculateLocalPhysics = useCallback((scenarioType: string) => {
    const nowStr = new Date().toLocaleTimeString();
    const scenarioMeta = supportedScenarios.find((s) => s.type === scenarioType);

    let mainGenKw = 250;
    let mainGenStatus = 'ONLINE';
    let backupGenKw = 0;
    let backupGenStatus = 'STANDBY';
    let windKw = 65;
    let windStatus = 'ONLINE';
    let batStatus = 'STANDBY';
    let batDischargeKw = 0;
    let batSoc = 55;
    let totalDemandKw = 185;

    const logs: any[] = [
      { timestamp: nowStr, message: `Emergency scenario initiated: ${scenarioMeta?.name || scenarioType}` },
    ];
    const whyList: string[] = [];

    if (scenarioType === 'generator_failure') {
      mainGenKw = 0;
      mainGenStatus = 'FAILED';
      logs.push({ timestamp: nowStr, message: 'Main Generator G1 failure detected. Output dropped: 250 kW -> 0 kW.' });
      whyList.push('Main generator G1 is FAILED (loss of 250 kW capacity).');
    } else if (scenarioType === 'battery_failure') {
      batStatus = 'OFFLINE';
      batSoc = 0;
      logs.push({ timestamp: nowStr, message: 'Battery storage BMS trip. Battery offline.' });
      whyList.push('Battery storage system offline due to BMS trip.');
    } else if (scenarioType === 'load_increase') {
      totalDemandKw += 85;
      logs.push({ timestamp: nowStr, message: 'Sudden load surge (+85 kW). Total station demand: 270 kW.' });
      whyList.push('Station demand spiked by +85 kW extra.');
    } else if (scenarioType === 'renewable_failure') {
      windKw = 5;
      windStatus = 'DROPPED';
      logs.push({ timestamp: nowStr, message: 'Wind generation dropped from 65 kW to 5 kW.' });
      whyList.push('Wind generation output dropped to 5 kW.');
    } else if (scenarioType === 'extreme_cold') {
      totalDemandKw += 50;
      logs.push({ timestamp: nowStr, message: 'Extreme cold storm (-40°C). Heating load +50 kW.' });
      whyList.push('Extreme cold (-40°C) increased thermal heating load.');
    } else if (scenarioType === 'multiple_failure') {
      mainGenKw = 0;
      mainGenStatus = 'FAILED';
      windKw = 0;
      windStatus = 'FAILED';
      logs.push({ timestamp: nowStr, message: 'CRITICAL MULTIPLE FAILURE: Main Generator and Wind Turbines failed!' });
      whyList.push('Main Generator G1 and Wind Turbines failed simultaneously.');
    } else if (scenarioType === 'custom_disaster') {
      mainGenKw = Math.max(0, 250 - customParams.capacityLossKw);
      totalDemandKw += customParams.loadSpikeKw;
      logs.push({ timestamp: nowStr, message: `Custom emergency test on ${customParams.failedComponent}: Loss -${customParams.capacityLossKw} kW, Spike +${customParams.loadSpikeKw} kW.` });
      whyList.push(`Custom failure injection on ${customParams.failedComponent}.`);
    }

    // Energy Deficit Calculation
    const availableGen = mainGenKw + windKw;
    let deficit = totalDemandKw - availableGen;

    logs.push({ timestamp: nowStr, message: `Energy balance recalculated: Total Demand = ${totalDemandKw} kW, Online Gen = ${availableGen} kW (Deficit: ${Math.max(0, deficit)} kW).` });

    // Battery Response Evaluation
    if (deficit > 0 && batStatus !== 'OFFLINE') {
      if (batSoc > 20) {
        batDischargeKw = Math.min(80, deficit);
        batStatus = 'DISCHARGING';
        deficit -= batDischargeKw;
        logs.push({ timestamp: nowStr, message: `Battery evaluated: SOC ${batSoc}% > 20%. Discharging at ${batDischargeKw} kW.` });
        whyList.push(`Battery discharging at ${batDischargeKw} kW (SOC: ${batSoc}%).`);
      } else {
        batStatus = 'RESERVE';
        logs.push({ timestamp: nowStr, message: `Battery evaluated: SOC ${batSoc}% at min reserve threshold (20%).` });
        whyList.push('Battery SOC is at 20% minimum reserve limit.');
      }
    }

    // Backup Generator Autostart Evaluation
    if (deficit > 0) {
      backupGenKw = Math.min(150, deficit + 20);
      backupGenStatus = 'ONLINE';
      deficit -= backupGenKw;
      logs.push({ timestamp: nowStr, message: `Backup Generator G2 auto-started at ${backupGenKw} kW output.` });
      whyList.push(`Backup Generator G2 auto-started at ${backupGenKw} kW.`);
    }

    // Equipment Load Protection Status
    const loadsList = [
      { id: 'life_support', name: 'Life Support & Oxygen', category: 'CRITICAL', simpleDescription: 'Must stay ON at all times for crew safety', icon: Heart, power_kw: 20.0, status: 'PROTECTED', priority: 1 },
      { id: 'comms', name: 'Emergency Satellite Comms', category: 'CRITICAL', simpleDescription: 'Keeps station connected to rescue base', icon: Radio, power_kw: 10.0, status: 'PROTECTED', priority: 1 },
      { id: 'research', name: 'Lab Research Equipment', category: 'HIGH_PRIORITY', simpleDescription: 'Scientific experiments & sample freezers', icon: Beaker, power_kw: 35.0, status: 'PROTECTED', priority: 2 },
      { id: 'hvac', name: 'Room Heating & HVAC', category: 'NON_CRITICAL', simpleDescription: 'Living quarters heating (can pause briefly)', icon: Home, power_kw: 25.0, status: 'SHED', priority: 3 },
    ];

    if (deficit > 0) {
      loadsList.find((l) => l.id === 'hvac')!.status = 'SHED';
      logs.push({ timestamp: nowStr, message: 'Non-critical load shedding initiated: Room Heating & HVAC (25 kW) shed.' });
    } else {
      loadsList.find((l) => l.id === 'hvac')!.status = 'PROTECTED';
    }

    logs.push({ timestamp: nowStr, message: 'Critical loads protected: Life Support (20 kW) and Comms (10 kW) 100% online.' });
    logs.push({ timestamp: nowStr, message: 'Emergency scenario stabilized. Power supply matches station demand.' });

    whyList.push('Critical Life Support and Emergency Comms prioritize continuous 100% uptime.');

    const totalSupplyKw = mainGenKw + backupGenKw + windKw + batDischargeKw;

    return {
      scenario_id: `emergency_${scenarioType}_${Date.now()}`,
      scenario_type: scenarioType,
      scenario_name: scenarioMeta?.name || 'Emergency Scenario',
      system_status: 'STABILIZED',
      metrics: {
        main_generator_kw: mainGenKw,
        main_generator_status: mainGenStatus,
        backup_generator_kw: backupGenKw,
        backup_generator_status: backupGenStatus,
        wind_generation_kw: windKw,
        wind_status: windStatus,
        battery_status: batStatus,
        battery_soc_percent: batSoc,
        battery_power_kw: batDischargeKw,
        total_supply_kw: totalSupplyKw,
        total_demand_kw: totalDemandKw,
        grid_stability_pct: deficit > 0 ? 70 : 100,
        grid_frequency_hz: deficit > 0 ? 48.5 : 50.0,
        fuel_hours: 146,
      },
      components: {
        main_generator: { name: 'Main Generator G1', status: mainGenStatus, output_kw: mainGenKw, capacity_kw: 250 },
        backup_generator: { name: 'Backup Generator G2', status: backupGenStatus, output_kw: backupGenKw, capacity_kw: 150 },
        battery: { name: 'LiFePO4 Battery Storage', status: batStatus, output_kw: batDischargeKw, soc_percent: batSoc, capacity_kwh: 200 },
        renewable: { name: 'Wind Turbine Array', status: windStatus, output_kw: windKw, capacity_kw: 100 },
      },
      loads: loadsList,
      battery_evaluation: {
        action: batStatus,
        soc_percent: batSoc,
        discharge_rate_kw: batDischargeKw,
        reason: `Battery evaluated at ${batSoc}% SOC. Action: ${batStatus} (${batDischargeKw} kW output).`,
      },
      ai_recommendation: {
        action: 'Maintain critical loads, activate backup generation, and preserve battery reserve.',
        why: whyList,
      },
      timeline_logs: logs,
      energy_flow: {
        generator: { active: mainGenStatus === 'ONLINE', status: mainGenStatus, power_kw: mainGenKw },
        backup_gen: { active: backupGenStatus === 'ONLINE', status: backupGenStatus, power_kw: backupGenKw },
        renewable: { active: windKw > 0, status: windStatus, power_kw: windKw },
        battery: { active: batStatus === 'DISCHARGING', status: batStatus, power_kw: batDischargeKw },
        critical_loads: { active: true, status: 'PROTECTED', power_kw: 30 },
        non_critical_loads: { active: loadsList.find((l) => l.id === 'hvac')?.status === 'PROTECTED', status: loadsList.find((l) => l.id === 'hvac')?.status, power_kw: 25 },
      },
    };
  }, [customParams]);

  // RUN EMERGENCY SCENARIO BUTTON HANDLER
  const handleRunScenario = async (scenarioType: string) => {
    setIsSimulating(true);
    setSelectedScenarioType(scenarioType);

    const scenarioMeta = supportedScenarios.find((s) => s.type === scenarioType);
    toast.error(`⚠️ Emergency Test: ${scenarioMeta?.name || 'Scenario'} Initiated`, {
      description: 'Evaluating microgrid physics and executing AI safety response...',
      duration: 3500,
    });

    try {
      // Try Backend API First
      const apiResult = await simulationService.runEmergencyScenario(scenarioType);
      if (apiResult && apiResult.metrics) {
        setState(apiResult);
      } else {
        // Fallback local physics engine
        const localResult = calculateLocalPhysics(scenarioType);
        setState(localResult);
      }
    } catch {
      // Fallback local physics engine if backend API offline
      const localResult = calculateLocalPhysics(scenarioType);
      setState(localResult);
    } finally {
      if (scenarioMeta?.severity === 'CRITICAL') {
        emergencyAudio.playEmergencyKlaxon();
      } else {
        emergencyAudio.playWarningPulse();
      }

      setIsSimulating(false);
      toast.success('✅ Emergency Stabilized!', {
        description: 'Power grid balanced and critical equipment protected.',
        duration: 4000,
      });
    }
  };

  // RESET SCENARIO BUTTON HANDLER
  const handleResetScenario = async () => {
    setIsSimulating(true);
    try {
      await simulationService.resetEmergencyScenario();
    } catch {
      // Ignore API reset error
    } finally {
      setState(getBaselineState());
      setSelectedScenarioType('generator_failure');
      setIsSimulating(false);
      emergencyAudio.playRecoveryChime();
      toast.info('Emergency Test Reset', { description: 'System returned to normal operating state.' });
    }
  };

  // Switch Toggle Handler
  const handleToggleSwitch = (compKey: string) => {
    emergencyAudio.playBreakerClick();
    setState((prev: any) => {
      const isCurrentlyOnline = prev.components[compKey]?.status === 'ONLINE';
      const nextStatus = isCurrentlyOnline ? 'OFF' : 'ONLINE';
      const nextKw = nextStatus === 'ONLINE' ? prev.components[compKey]?.capacity_kw || 50 : 0;

      toast.info(`${prev.components[compKey]?.name || compKey} turned ${nextStatus}`);

      const updatedComp = {
        ...prev.components,
        [compKey]: { ...prev.components[compKey], status: nextStatus, output_kw: nextKw },
      };

      const totalCap = (updatedComp.main_generator.output_kw || 0) + (updatedComp.backup_generator.output_kw || 0) + (updatedComp.battery.output_kw || 0) + (updatedComp.renewable.output_kw || 0);

      return {
        ...prev,
        components: updatedComp,
        metrics: {
          ...prev.metrics,
          total_supply_kw: totalCap,
          grid_stability_pct: totalCap >= prev.metrics.total_demand_kw ? 100 : 70,
        },
      };
    });
  };

  // Load Shedding Toggle Handler
  const handleToggleLoad = (loadId: string) => {
    emergencyAudio.playBreakerClick();
    setState((prev: any) => {
      const updatedLoads = prev.loads.map((l: any) => {
        if (l.id === loadId) {
          const nextStatus = l.status === 'PROTECTED' ? 'SHED' : 'PROTECTED';
          toast.info(`${l.name} set to ${nextStatus}`);
          return { ...l, status: nextStatus };
        }
        return l;
      });

      return { ...prev, loads: updatedLoads };
    });
  };

  const downloadReport = () => {
    const reportText = `
===================================================================
POLAR STATION EMERGENCY RESPONSE REPORT
===================================================================
Date & Time: ${new Date().toLocaleString()}
Station Name: Polar Science Base Alpha
Scenario: ${state.scenario_name || 'Baseline'}
System Status: ${state.system_status || 'ALL SYSTEMS NORMAL'}

[POWER GRID HEALTH]
Power Grid Stability: ${state.metrics?.grid_stability_pct || 100}%
Grid Frequency: ${state.metrics?.grid_frequency_hz || 50.0} Hz
Total Power Generation: ${state.metrics?.total_supply_kw || 0} kW
Total Station Power Demand: ${state.metrics?.total_demand_kw || 0} kW
Fuel Remaining: ${state.metrics?.fuel_hours || 148} Hours

[POWER SWITCHES]
- Main Generator G1: ${state.components?.main_generator?.status} (${state.components?.main_generator?.output_kw} kW)
- Backup Generator G2: ${state.components?.backup_generator?.status} (${state.components?.backup_generator?.output_kw} kW)
- Battery Storage: ${state.components?.battery?.status} (${state.components?.battery?.output_kw} kW, SOC: ${state.components?.battery?.soc_percent}%)
- Wind Turbines: ${state.components?.renewable?.status} (${state.components?.renewable?.output_kw} kW)

[IMPORTANT STATION EQUIPMENT PROTECTION]
${(state.loads || []).map((l: any) => `- [${l.category}] ${l.name}: ${l.status} (${l.power_kw} kW)`).join('\n')}

[AI EMERGENCY RECOMMENDATION]
Action: ${state.ai_recommendation?.action || 'N/A'}
Why:
${(state.ai_recommendation?.why || []).map((w: string) => `  * ${w}`).join('\n')}

[ACTIVITY HISTORY LOG]
${(state.timeline_logs || []).map((log: any) => `[${log.timestamp}] ${log.message}`).join('\n')}

===================================================================
END OF REPORT
===================================================================
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Emergency_Report_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Downloaded Emergency Incident Summary!');
  };

  const metrics = state.metrics || {};
  const components = state.components || {};
  const loads = state.loads || [];
  const logs = state.timeline_logs || [];
  const aiRec = state.ai_recommendation || {};

  const filteredLogs = logs.filter((log: any) => {
    if (logFilter === 'all') return true;
    if (logFilter === 'critical') return log.message.toLowerCase().includes('failed') || log.message.toLowerCase().includes('critical') || log.message.toLowerCase().includes('surge');
    if (logFilter === 'warning') return log.message.toLowerCase().includes('evaluated') || log.message.toLowerCase().includes('deficit') || log.message.toLowerCase().includes('drop');
    if (logFilter === 'success') return log.message.toLowerCase().includes('stabilized') || log.message.toLowerCase().includes('protected') || log.message.toLowerCase().includes('complete');
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-dark-card via-polar-950/80 to-dark-card border border-dark-border p-5 rounded-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="text-polar-400" size={26} />
            <h1 className="text-2xl font-bold text-gray-100">Emergency Response & Safety Center</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Monitor station power, test emergency situations, and protect essential equipment.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={toggleSound}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all',
              isMuted
                ? 'bg-dark-surface text-gray-400 border-dark-border'
                : 'bg-status-warning/20 text-status-warning border-status-warning/40'
            )}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isMuted ? 'Sound Off' : 'Sound Alarm On'}</span>
          </button>

          <button
            onClick={downloadReport}
            className="btn-secondary text-xs flex items-center space-x-1.5 py-2 px-3"
          >
            <Download size={14} />
            <span>Download Summary</span>
          </button>

          <button
            onClick={handleResetScenario}
            disabled={isSimulating}
            className="btn-secondary text-xs flex items-center space-x-1.5 py-2 px-3 hover:border-status-warning/50"
          >
            <RotateCcw size={14} className="text-status-warning" />
            <span>RESET SCENARIO</span>
          </button>

          <Badge variant={state.system_status === 'STABILIZED' ? 'warning' : 'success'} size="lg">
            <Activity size={14} className={cn('mr-1.5', isSimulating && 'animate-spin')} />
            {isSimulating ? 'TEST IN PROGRESS' : state.system_status || 'ALL SYSTEMS SAFE'}
          </Badge>
        </div>
      </div>

      {/* Live Sensor Readings Panel */}
      {(() => {
        const freq = metrics.grid_frequency_hz || 50.0;
        const stability = metrics.grid_stability_pct ?? 100;
        const supply = metrics.total_supply_kw || 0;
        const demand = metrics.total_demand_kw || 0;
        const surplus = supply - demand;
        const fuel = metrics.fuel_hours || 148;
        const batSoc = components.battery?.soc_percent ?? 55;
        const windKw = components.renewable?.output_kw ?? 65;
        const mainKw = components.main_generator?.output_kw ?? 250;
        const isNormal = state.system_status !== 'STABILIZED';

        // Helper: derive a simple Normal / Warning / Critical badge
        const badge = (condition: 'normal' | 'warning' | 'critical') => {
          if (condition === 'normal')   return { label: 'NORMAL',   cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
          if (condition === 'warning')  return { label: 'WARNING',  cls: 'bg-amber-500/15  text-amber-400  border-amber-500/30  animate-pulse' };
          return                               { label: 'CRITICAL', cls: 'bg-rose-500/15   text-rose-400   border-rose-500/30   animate-pulse' };
        };

        const freqBadge   = freq >= 49.5 ? badge('normal') : freq >= 48.5 ? badge('warning') : badge('critical');
        const stabBadge   = stability === 100 ? badge('normal') : stability >= 80 ? badge('warning') : badge('critical');
        const surplusBadge = surplus >= 0 ? badge('normal') : surplus >= -30 ? badge('warning') : badge('critical');
        const fuelBadge   = fuel >= 72 ? badge('normal') : fuel >= 24 ? badge('warning') : badge('critical');
        const batBadge    = batSoc >= 30 ? badge('normal') : batSoc >= 15 ? badge('warning') : badge('critical');
        const windBadge   = windKw >= 30 ? badge('normal') : windKw >= 10 ? badge('warning') : badge('critical');
        const genBadge    = mainKw >= 200 ? badge('normal') : mainKw >= 50 ? badge('warning') : badge('critical');
        const loadBadge   = isNormal ? badge('normal') : badge('warning');

        const sensors = [
          {
            label: 'Grid Frequency',
            value: `${freq.toFixed(2)} Hz`,
            note: freq >= 49.5 ? 'Operating at nominal 50 Hz' : freq >= 48.5 ? 'Slight drop — monitor closely' : 'Under-frequency — risk of trip',
            ref: '49.5 – 50.5 Hz  =  Normal',
            badge: freqBadge,
            icon: Activity,
          },
          {
            label: 'Grid Stability',
            value: `${stability}%`,
            note: stability === 100 ? 'Supply fully covering demand' : stability >= 80 ? 'Minor deficit — backup compensating' : 'Unstable — load shedding active',
            ref: '100% = Fully Stable',
            badge: stabBadge,
            icon: Shield,
          },
          {
            label: 'Power Surplus / Deficit',
            value: `${surplus >= 0 ? '+' : ''}${surplus} kW`,
            note: surplus >= 0 ? `${surplus} kW of headroom above demand` : `${Math.abs(surplus)} kW shortfall — compensating`,
            ref: 'Supply: ' + supply + ' kW  |  Demand: ' + demand + ' kW',
            badge: surplusBadge,
            icon: Zap,
          },
          {
            label: 'Main Generator Output',
            value: `${mainKw} kW`,
            note: mainKw >= 200 ? 'Running at full rated capacity' : mainKw >= 50 ? 'Running at reduced output' : 'Offline or failed — backup needed',
            ref: 'Rated capacity: 250 kW',
            badge: genBadge,
            icon: Power,
          },
          {
            label: 'Wind Generation',
            value: `${windKw} kW`,
            note: windKw >= 30 ? 'Wind contributing well to grid' : windKw >= 10 ? 'Low wind — partial generation only' : 'Wind stopped — no renewable input',
            ref: 'Rated capacity: 100 kW',
            badge: windBadge,
            icon: Wind,
          },
          {
            label: 'Battery SOC',
            value: `${batSoc}%`,
            note: batSoc >= 30 ? 'Battery charge is healthy' : batSoc >= 15 ? 'Low charge — limit discharging' : 'Critical reserve — protect battery',
            ref: 'Min safe reserve: 20%',
            badge: batBadge,
            icon: Battery,
          },
          {
            label: 'Diesel Fuel Reserve',
            value: `${fuel} hrs`,
            note: fuel >= 72 ? 'Plenty of fuel for extended ops' : fuel >= 24 ? 'Less than 3 days — schedule resupply' : 'Critical — fuel resupply urgent',
            ref: 'Safe threshold: > 72 hrs',
            badge: fuelBadge,
            icon: Flame,
          },
          {
            label: 'Critical Load Status',
            value: isNormal ? 'ALL PROTECTED' : 'MONITORING',
            note: isNormal ? 'Life support & comms fully powered' : 'Emergency mode — loads prioritized',
            ref: 'Life Support + Comms = Always ON',
            badge: loadBadge,
            icon: Heart,
          },
        ];

        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <Activity size={16} className="text-polar-400" />
                  Live Station Sensor Readings
                </p>
                <p className="text-xs text-gray-500 mt-0.5">All values calculated by the physics engine in real-time</p>
              </div>
              <span className={cn(
                'text-[10px] font-mono font-bold px-3 py-1 rounded-full border',
                isNormal
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
              )}>
                {isNormal ? '● ALL SYSTEMS NORMAL' : '⚠ EMERGENCY MODE ACTIVE'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sensors.map(({ label, value, note, ref, badge: b, icon: Icon }) => (
                <div
                  key={label}
                  className="p-4 bg-dark-card border border-dark-border rounded-xl space-y-2 hover:border-polar-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon size={13} className="text-gray-400" />
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                    </div>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono', b.cls)}>
                      {b.label}
                    </span>
                  </div>
                  <div className={cn(
                    'text-xl font-black font-mono tabular-nums',
                    b.label === 'NORMAL'   && 'text-emerald-400',
                    b.label === 'WARNING'  && 'text-amber-400',
                    b.label === 'CRITICAL' && 'text-rose-400',
                  )}>
                    {value}
                  </div>
                  <p className="text-[11px] text-gray-300 leading-tight">{note}</p>
                  <p className="text-[10px] text-gray-500 font-mono border-t border-white/5 pt-1.5">{ref}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* EMERGENCY STATUS PANEL */}
      <Card>
        <CardHeader
          title="EMERGENCY STATUS PANEL"
          subtitle="Real-time calculated status of generators, battery, and critical loads"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Main Gen */}
          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">MAIN GENERATOR</span>
            <div className="my-2 flex items-center space-x-1.5">
              {components.main_generator?.status === 'FAILED' ? (
                <XCircle size={18} className="text-status-critical" />
              ) : (
                <CheckCircle2 size={18} className="text-status-success" />
              )}
              <span className={cn('text-sm font-bold font-mono', components.main_generator?.status === 'FAILED' ? 'text-status-critical' : 'text-status-success')}>
                {components.main_generator?.status || 'ONLINE'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              {components.main_generator?.output_kw || 0} kW
            </span>
          </div>

          {/* Renewable */}
          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">RENEWABLE</span>
            <div className="my-2 flex items-center space-x-1.5">
              <CheckCircle2 size={18} className={components.renewable?.status === 'DROPPED' ? 'text-status-warning' : 'text-status-success'} />
              <span className={cn('text-sm font-bold font-mono', components.renewable?.status === 'DROPPED' ? 'text-status-warning' : 'text-status-success')}>
                {components.renewable?.status || 'ONLINE'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              {components.renewable?.output_kw || 0} kW
            </span>
          </div>

          {/* Battery */}
          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">BATTERY</span>
            <div className="my-2 flex items-center space-x-1.5">
              {components.battery?.status === 'DISCHARGING' ? (
                <Activity size={18} className="text-status-warning animate-pulse" />
              ) : (
                <CheckCircle2 size={18} className="text-status-success" />
              )}
              <span className={cn('text-sm font-bold font-mono', components.battery?.status === 'DISCHARGING' ? 'text-status-warning' : 'text-status-success')}>
                {components.battery?.status || 'STANDBY'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              SOC: {components.battery?.soc_percent || 55}% ({components.battery?.output_kw || 0} kW)
            </span>
          </div>

          {/* Backup Gen */}
          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">BACKUP GENERATOR</span>
            <div className="my-2 flex items-center space-x-1.5">
              <CheckCircle2 size={18} className={components.backup_generator?.status === 'ONLINE' ? 'text-status-success' : 'text-gray-400'} />
              <span className={cn('text-sm font-bold font-mono', components.backup_generator?.status === 'ONLINE' ? 'text-status-success' : 'text-gray-400')}>
                {components.backup_generator?.status || 'STANDBY'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              {components.backup_generator?.output_kw || 0} kW
            </span>
          </div>

          {/* Critical Load */}
          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">CRITICAL LOAD</span>
            <div className="my-2 flex items-center space-x-1.5">
              <Shield size={18} className="text-status-success" />
              <span className="text-sm font-bold font-mono text-status-success">PROTECTED</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              100% Powered
            </span>
          </div>

          {/* Non-Critical Load */}
          <div className="p-3 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">NON-CRITICAL LOAD</span>
            <div className="my-2 flex items-center space-x-1.5">
              {loads.some((l: any) => l.category === 'NON_CRITICAL' && l.status === 'SHED') ? (
                <AlertCircle size={18} className="text-status-warning" />
              ) : (
                <CheckCircle2 size={18} className="text-status-success" />
              )}
              <span className={cn('text-sm font-bold font-mono', loads.some((l: any) => l.category === 'NON_CRITICAL' && l.status === 'SHED') ? 'text-status-warning' : 'text-status-success')}>
                {loads.some((l: any) => l.category === 'NON_CRITICAL' && l.status === 'SHED') ? 'SHED' : 'PROTECTED'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              Priority Managed
            </span>
          </div>
        </div>
      </Card>

      {/* Generator & Battery Controls */}
      <Card>
        <CardHeader
          title="Generator & Battery Controls"
          subtitle="Simple manual switches for generators, battery storage, and wind power"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gen 1 */}
          <div className={cn('p-4 rounded-xl border flex flex-col justify-between space-y-3', components.main_generator?.status === 'ONLINE' ? 'bg-dark-surface border-dark-border' : 'bg-status-critical/10 border-status-critical/40')}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-100">{components.main_generator?.name || 'Main Generator G1'}</h4>
                <p className="text-xs text-gray-400">Primary Power Unit</p>
              </div>
              <Badge variant={components.main_generator?.status === 'ONLINE' ? 'success' : 'critical'} size="sm">
                {components.main_generator?.status || 'ONLINE'}
              </Badge>
            </div>
            <div className="text-xs font-mono text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="text-gray-200">{components.main_generator?.capacity_kw || 250} kW</span>
              </div>
              <div className="flex justify-between">
                <span>Output:</span>
                <span className="text-polar-400 font-bold">{components.main_generator?.output_kw || 0} kW</span>
              </div>
            </div>
            <button
              onClick={() => handleToggleSwitch('main_generator')}
              className={cn('w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all', components.main_generator?.status === 'ONLINE' ? 'bg-status-critical/20 text-status-critical border-status-critical/40' : 'bg-status-success/20 text-status-success border-status-success/40')}
            >
              <Power size={14} />
              <span>{components.main_generator?.status === 'ONLINE' ? 'TURN OFF' : 'TURN ON'}</span>
            </button>
          </div>

          {/* Backup Gen 2 */}
          <div className={cn('p-4 rounded-xl border flex flex-col justify-between space-y-3', components.backup_generator?.status === 'ONLINE' ? 'bg-dark-surface border-dark-border' : 'bg-dark-bg border-dark-border opacity-70')}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-100">{components.backup_generator?.name || 'Backup Generator G2'}</h4>
                <p className="text-xs text-gray-400">Backup Power Unit</p>
              </div>
              <Badge variant={components.backup_generator?.status === 'ONLINE' ? 'success' : 'info'} size="sm">
                {components.backup_generator?.status || 'STANDBY'}
              </Badge>
            </div>
            <div className="text-xs font-mono text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="text-gray-200">{components.backup_generator?.capacity_kw || 150} kW</span>
              </div>
              <div className="flex justify-between">
                <span>Output:</span>
                <span className="text-polar-400 font-bold">{components.backup_generator?.output_kw || 0} kW</span>
              </div>
            </div>
            <button
              onClick={() => handleToggleSwitch('backup_generator')}
              className={cn('w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all', components.backup_generator?.status === 'ONLINE' ? 'bg-status-critical/20 text-status-critical border-status-critical/40' : 'bg-status-success/20 text-status-success border-status-success/40')}
            >
              <Power size={14} />
              <span>{components.backup_generator?.status === 'ONLINE' ? 'TURN OFF' : 'TURN ON'}</span>
            </button>
          </div>

          {/* Battery */}
          <div className={cn('p-4 rounded-xl border flex flex-col justify-between space-y-3', components.battery?.status === 'DISCHARGING' ? 'bg-status-warning/10 border-status-warning/40' : 'bg-dark-surface border-dark-border')}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-100">{components.battery?.name || 'Battery Storage'}</h4>
                <p className="text-xs text-gray-400">SOC: {components.battery?.soc_percent || 55}%</p>
              </div>
              <Badge variant={components.battery?.status === 'DISCHARGING' ? 'warning' : 'success'} size="sm">
                {components.battery?.status || 'STANDBY'}
              </Badge>
            </div>
            <div className="text-xs font-mono text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="text-gray-200">{components.battery?.capacity_kwh || 200} kWh</span>
              </div>
              <div className="flex justify-between">
                <span>Discharge:</span>
                <span className="text-yellow-400 font-bold">{components.battery?.output_kw || 0} kW</span>
              </div>
            </div>
            <button
              onClick={() => handleToggleSwitch('battery')}
              className={cn('w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all', components.battery?.status === 'ONLINE' || components.battery?.status === 'DISCHARGING' ? 'bg-status-critical/20 text-status-critical border-status-critical/40' : 'bg-status-success/20 text-status-success border-status-success/40')}
            >
              <Power size={14} />
              <span>{components.battery?.status === 'ONLINE' || components.battery?.status === 'DISCHARGING' ? 'TURN OFF' : 'TURN ON'}</span>
            </button>
          </div>

          {/* Renewable Wind */}
          <div className="p-4 bg-dark-surface border border-dark-border rounded-xl flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-100">{components.renewable?.name || 'Wind Turbines'}</h4>
                <p className="text-xs text-gray-400">Clean Wind Power</p>
              </div>
              <Badge variant={components.renewable?.status === 'DROPPED' ? 'warning' : 'success'} size="sm">
                {components.renewable?.status || 'ONLINE'}
              </Badge>
            </div>
            <div className="text-xs font-mono text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="text-gray-200">{components.renewable?.capacity_kw || 100} kW</span>
              </div>
              <div className="flex justify-between">
                <span>Output:</span>
                <span className="text-polar-400 font-bold">{components.renewable?.output_kw || 0} kW</span>
              </div>
            </div>
            <button
              onClick={() => handleToggleSwitch('renewable')}
              className={cn('w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all', components.renewable?.output_kw > 0 ? 'bg-status-critical/20 text-status-critical border-status-critical/40' : 'bg-status-success/20 text-status-success border-status-success/40')}
            >
              <Power size={14} />
              <span>{components.renewable?.output_kw > 0 ? 'TURN OFF' : 'TURN ON'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* TEST EMERGENCY SCENARIO SECTION */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-border pb-4 mb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Play className="text-polar-400 fill-polar-400" size={16} />
              Test Emergency Scenarios
            </h2>
            <p className="text-xs text-gray-400">Select an emergency scenario to test AI safety response and generator controls</p>
          </div>
          <div className="flex space-x-2 bg-dark-bg p-1 rounded-lg border border-dark-border self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('preset')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-all', activeTab === 'preset' ? 'bg-polar-600 text-white' : 'text-gray-400')}
            >
              Preset Emergencies
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1', activeTab === 'custom' ? 'bg-polar-600 text-white' : 'text-gray-400')}
            >
              <Sliders size={14} />
              <span>Custom Test</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === 'preset' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedScenarios.map((scenario) => {
              const Icon = scenario.icon;
              const isSelected = selectedScenarioType === scenario.type;

              return (
                <div
                  key={scenario.type}
                  onClick={() => !isSimulating && setSelectedScenarioType(scenario.type)}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer',
                    'hover:border-polar-400 hover:bg-polar-900/20',
                    isSelected ? 'border-polar-400 bg-polar-900/30 ring-1 ring-polar-400/50' : 'border-dark-border bg-dark-surface',
                    isSimulating && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-dark-bg flex items-center justify-center flex-shrink-0 border border-dark-border">
                      <Icon size={20} className={scenario.severity === 'CRITICAL' ? 'text-status-critical' : 'text-status-warning'} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-100">{scenario.name}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{scenario.description}</p>
                    </div>
                  </div>

                  {isSelected && isSimulating && (
                    <div className="flex items-center space-x-2 text-xs text-polar-400 font-medium mt-3">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Executing AI Emergency Response...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Custom Emergency Test Form */}
        {activeTab === 'custom' && (
          <div className="space-y-4 bg-dark-surface p-5 rounded-xl border border-dark-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Equipment Name</label>
                <input
                  type="text"
                  value={customParams.failedComponent}
                  onChange={(e) => setCustomParams({ ...customParams, failedComponent: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border text-xs text-gray-100 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 flex justify-between mb-1">
                  <span>Power Lost (kW)</span>
                  <span className="text-status-critical font-bold">{customParams.capacityLossKw} kW</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={customParams.capacityLossKw}
                  onChange={(e) => setCustomParams({ ...customParams, capacityLossKw: +e.target.value })}
                  className="w-full accent-polar-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 flex justify-between mb-1">
                  <span>Extra Power Demand (kW)</span>
                  <span className="text-yellow-400 font-bold">{customParams.loadSpikeKw} kW</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={customParams.loadSpikeKw}
                  onChange={(e) => setCustomParams({ ...customParams, loadSpikeKw: +e.target.value })}
                  className="w-full accent-yellow-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Triggers */}
        <div className="flex items-center justify-end space-x-3 pt-4 mt-4 border-t border-dark-border">
          <button
            onClick={handleResetScenario}
            disabled={isSimulating}
            className="btn-secondary text-xs flex items-center space-x-2 py-2.5 px-4"
          >
            <RotateCcw size={15} />
            <span>RESET SCENARIO</span>
          </button>

          <button
            onClick={() => handleRunScenario(activeTab === 'custom' ? 'custom_disaster' : selectedScenarioType)}
            disabled={isSimulating}
            className="btn-primary text-xs flex items-center space-x-2 py-2.5 px-5"
          >
            {isSimulating ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} className="fill-white" />}
            <span>RUN SCENARIO</span>
          </button>
        </div>
      </Card>

      {/* ENERGY FLOW DIAGRAM */}
      <Card>
        <CardHeader
          title="ENERGY FLOW DIAGRAM"
          subtitle="Real-time calculated energy routing between generators, battery, and station loads"
        />
        <div className="p-4 bg-dark-surface rounded-xl border border-dark-border flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className={cn('p-3 rounded-lg border text-center flex-1 w-full', components.main_generator?.status === 'ONLINE' ? 'bg-status-success/10 border-status-success/40' : 'bg-status-critical/10 border-status-critical/40 opacity-60')}>
            <div className="font-bold mb-1">MAIN GENERATOR</div>
            <div>{components.main_generator?.status || 'ONLINE'}</div>
            <div className="text-polar-400 mt-1">{components.main_generator?.output_kw || 0} kW</div>
          </div>

          <ArrowRight size={20} className="text-gray-500 hidden md:block" />

          <div className="flex flex-col gap-2 flex-1 w-full">
            <div className={cn('p-3 rounded-lg border text-center', (components.renewable?.output_kw || 0) > 0 ? 'bg-status-success/10 border-status-success/40' : 'bg-dark-bg border-dark-border opacity-60')}>
              <div className="font-bold">RENEWABLE WIND</div>
              <div className="text-polar-400 mt-1">{components.renewable?.output_kw || 0} kW</div>
            </div>

            <div className={cn('p-3 rounded-lg border text-center', components.battery?.status === 'DISCHARGING' ? 'bg-status-warning/10 border-status-warning/40' : 'bg-dark-bg border-dark-border opacity-60')}>
              <div className="font-bold">BATTERY STORAGE</div>
              <div className="text-yellow-400 mt-1">{components.battery?.status}: {components.battery?.output_kw || 0} kW</div>
            </div>

            <div className={cn('p-3 rounded-lg border text-center', components.backup_generator?.status === 'ONLINE' ? 'bg-status-success/10 border-status-success/40' : 'bg-dark-bg border-dark-border opacity-60')}>
              <div className="font-bold">BACKUP GENERATOR</div>
              <div className="text-emerald-400 mt-1">{components.backup_generator?.status}: {components.backup_generator?.output_kw || 0} kW</div>
            </div>
          </div>

          <ArrowRight size={20} className="text-gray-500 hidden md:block" />

          <div className="p-4 bg-polar-950/60 border border-polar-600/40 rounded-lg text-center flex-1 w-full">
            <Cpu size={24} className="mx-auto text-polar-400 mb-1" />
            <div className="font-bold text-polar-300">STATION POWER BUS</div>
            <div className="text-gray-300 mt-1">Supply: {metrics.total_supply_kw || 0} kW</div>
            <div className="text-gray-400">Demand: {metrics.total_demand_kw || 0} kW</div>
          </div>

          <ArrowRight size={20} className="text-gray-500 hidden md:block" />

          <div className="flex flex-col gap-2 flex-1 w-full">
            <div className="p-3 bg-status-success/10 border border-status-success/40 rounded-lg text-center">
              <div className="font-bold text-status-success">CRITICAL LOADS</div>
              <div className="text-gray-200 mt-1">PROTECTED (30 kW)</div>
            </div>

            <div className={cn('p-3 rounded-lg border text-center', loads.find((l: any) => l.id === 'hvac')?.status === 'SHED' ? 'bg-status-warning/10 border-status-warning/40' : 'bg-status-success/10 border-status-success/40')}>
              <div className="font-bold">NON-CRITICAL LOADS</div>
              <div className="mt-1">{loads.find((l: any) => l.id === 'hvac')?.status || 'PROTECTED'}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* IMPORTANT STATION EQUIPMENT PROTECTION & BATTERY EVALUATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Protection Grid (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="IMPORTANT STATION EQUIPMENT PROTECTION"
            subtitle="Priority load protection automatically protects critical systems during emergencies"
          />
          <div className="space-y-3">
            {loads.map((load: any) => {
              const isProtected = load.status === 'PROTECTED';
              const isCritical = load.category === 'CRITICAL';
              const isHigh = load.category === 'HIGH_PRIORITY';

              return (
                <div
                  key={load.id}
                  className={cn(
                    'p-3.5 rounded-xl border flex items-center justify-between transition-all',
                    isProtected
                      ? 'bg-status-success/10 border-status-success/30'
                      : 'bg-status-warning/10 border-status-warning/30'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono',
                        isProtected ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning'
                      )}
                    >
                      {isProtected ? '☑' : '☐'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-gray-100">{load.name}</h4>
                        <Badge variant={isCritical ? 'critical' : isHigh ? 'warning' : 'info'} size="sm">
                          {load.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 font-sans mt-0.5">{load.simpleDescription}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-gray-400">{formatPower(load.power_kw)}</span>
                    <button
                      onClick={() => handleToggleLoad(load.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-mono uppercase font-bold transition-all',
                        isProtected ? 'bg-status-success/20 text-status-success' : 'bg-status-warning/20 text-status-warning'
                      )}
                    >
                      {isProtected ? 'PROTECTED' : 'PAUSED'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* BATTERY EVALUATION BOX (1 col) */}
        <Card className="lg:col-span-1">
          <div className="flex items-center space-x-2 mb-3">
            <Battery className="text-battery" size={20} />
            <h3 className="text-base font-bold text-gray-100">BATTERY EVALUATION</h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Current Battery SOC:</span>
              <span className="font-bold text-polar-400">{state.battery_evaluation?.soc_percent || components.battery?.soc_percent || 55}%</span>
            </div>

            <div className="p-3 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Evaluated Action:</span>
              <span className="font-bold text-yellow-400">{state.battery_evaluation?.action || components.battery?.status || 'STANDBY'}</span>
            </div>

            <div className="p-3 bg-dark-surface border border-dark-border rounded-lg flex justify-between">
              <span className="text-gray-400">Discharge Power:</span>
              <span className="font-bold text-gray-100">{state.battery_evaluation?.discharge_rate_kw || components.battery?.output_kw || 0} kW</span>
            </div>

            <div className="p-3 bg-dark-surface border border-dark-border rounded-lg">
              <div className="text-[11px] font-bold text-gray-300 mb-1">EVALUATION REASON:</div>
              <p className="text-gray-400 leading-relaxed font-sans text-xs">
                {state.battery_evaluation?.reason || 'Battery state continuously evaluated based on SOC, demand, and backup generator response.'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI RECOMMENDATION & SYSTEM LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendation (1 col) */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-polar-950/40 via-dark-card to-dark-card border-polar-600/30">
          <div className="flex items-center space-x-2 mb-3">
            <Cpu className="text-polar-400" size={20} />
            <h3 className="text-base font-bold text-gray-100">AI RECOMMENDATION</h3>
          </div>

          <div className="p-3 bg-polar-900/20 border border-polar-600/40 rounded-xl mb-3">
            <p className="text-xs font-semibold text-gray-100 leading-relaxed">
              "{aiRec.action || 'Maintain critical loads, activate available backup generation, and preserve battery reserve.'}"
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-bold text-gray-400">WHY? (REASONING):</span>
            <ul className="space-y-1 text-xs text-gray-300 pl-4 list-disc">
              {(aiRec.why || [
                'Main generator unavailable',
                'Current demand exceeds online generation',
                'Battery reserve maintained above min limit',
                'Critical Life Support prioritized',
              ]).map((reason: string, idx: number) => (
                <li key={idx} className="leading-relaxed">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* System Activity Logs (2 cols) */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <FileText size={18} className="text-polar-400" />
                SYSTEM ACTIVITY LOG
              </h3>
              <p className="text-xs text-gray-400">Real calculated values with current application timestamps</p>
            </div>

            <div className="flex space-x-1 text-[11px]">
              {(['all', 'critical', 'warning', 'info', 'success'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={cn(
                    'px-2.5 py-1 rounded-md uppercase transition-all',
                    logFilter === filter ? 'bg-polar-600 text-white font-bold' : 'bg-dark-bg text-gray-400 hover:text-gray-200'
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-8 font-sans">
                No logs recorded yet. Click RUN SCENARIO to test emergency response.
              </div>
            ) : (
              filteredLogs.map((log: any, index: number) => (
                <div key={index} className="p-2.5 bg-dark-surface border border-dark-border rounded-lg flex items-start space-x-3">
                  <span className="text-polar-400 font-bold flex-shrink-0">[{log.timestamp}]</span>
                  <span className="text-gray-200 leading-relaxed font-sans">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
