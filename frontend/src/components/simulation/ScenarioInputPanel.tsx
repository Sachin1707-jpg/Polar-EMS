/**
 * Scenario Input Panel
 * Comprehensive configuration interface for simulation scenarios
 */
import { useState } from 'react';
import {
  Thermometer,
  Wind,
  CloudSnow,
  Sun,
  Clock,
  Zap,
  Battery,
  Fuel,
  Settings,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import type { SimulationRequest } from '@/services/api/simulation.service';

interface ScenarioInputPanelProps {
  scenario: SimulationRequest;
  onChange: (scenario: SimulationRequest) => void;
}

export function ScenarioInputPanel({ scenario, onChange }: ScenarioInputPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['environment', 'load', 'renewable', 'battery'])
  );
  const [loadMode, setLoadMode] = useState<'simple' | 'advanced'>('advanced');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const updateEnvironment = (field: string, value: any) => {
    onChange({
      ...scenario,
      environment: { ...scenario.environment, [field]: value }
    });
  };

  const updateLoad = (field: string, value: number) => {
    onChange({
      ...scenario,
      load: { ...scenario.load, [field]: value }
    });
  };

  const handleSimpleLoadChange = (total: number) => {
    const baseRatio = 0.4;
    const researchRatio = 0.2;
    const habRatio = 0.15;
    const commRatio = 0.05;
    const critRatio = 0.12;
    const defRatio = 0.08;
    onChange({
      ...scenario,
      load: {
        base_load_kw: Math.round(total * baseRatio * 10) / 10,
        research_load_kw: Math.round(total * researchRatio * 10) / 10,
        habitation_load_kw: Math.round(total * habRatio * 10) / 10,
        communication_load_kw: Math.round(total * commRatio * 10) / 10,
        critical_load_kw: Math.round(total * critRatio * 10) / 10,
        deferrable_load_kw: Math.round(total * defRatio * 10) / 10,
      }
    });
  };

  const updateRenewable = (field: string, value: number) => {
    onChange({
      ...scenario,
      renewable: { ...scenario.renewable, [field]: value }
    });
  };

  const updateBattery = (field: string, value: number) => {
    onChange({
      ...scenario,
      battery: { ...scenario.battery, [field]: value }
    });
  };

  const updateGenerator = (field: string, value: any) => {
    onChange({
      ...scenario,
      generator: { ...scenario.generator, [field]: value }
    });
  };

  const updateEvents = (field: string, value: any) => {
    onChange({
      ...scenario,
      events: { ...scenario.events, [field]: value }
    });
  };

  const updateParameters = (field: string, value: any) => {
    onChange({
      ...scenario,
      parameters: { ...scenario.parameters, [field]: value }
    });
  };

  const getTotalLoad = () => {
    return (
      scenario.load.base_load_kw +
      scenario.load.research_load_kw +
      scenario.load.habitation_load_kw +
      scenario.load.communication_load_kw +
      scenario.load.critical_load_kw +
      scenario.load.deferrable_load_kw
    );
  };

  return (
    <div className="space-y-4">
      {/* Environment Conditions */}
      <ConfigSection
        title="Environment Conditions"
        subtitle="Weather and seasonal parameters"
        icon={CloudSnow}
        expanded={expandedSections.has('environment')}
        onToggle={() => toggleSection('environment')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Temperature (°C)"
            icon={Thermometer}
            value={scenario.environment.temperature_c}
            onChange={(v) => updateEnvironment('temperature_c', parseFloat(v) || 0)}
            type="number"
            min={-60}
            max={20}
            step={0.1}
            help="Ambient air temperature"
          />

          <InputField
            label="Wind Speed (m/s)"
            icon={Wind}
            value={scenario.environment.wind_speed_ms}
            onChange={(v) => updateEnvironment('wind_speed_ms', parseFloat(v) || 0)}
            type="number"
            min={0}
            max={40}
            step={0.1}
            help="Current wind speed"
          />

          <SelectField
            label="Wind Direction"
            icon={Wind}
            value={scenario.environment.wind_direction}
            onChange={(v) => updateEnvironment('wind_direction', v)}
            options={['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']}
          />

          <SelectField
            label="Weather Condition"
            icon={CloudSnow}
            value={scenario.environment.weather_condition}
            onChange={(v) => updateEnvironment('weather_condition', v)}
            options={[
              'Clear',
              'Cloudy',
              'Snow',
              'Snow Storm',
              'Blizzard',
              'Fog',
              'Variable'
            ]}
          />

          <SelectField
            label="Polar Season"
            icon={Sun}
            value={scenario.environment.polar_season}
            onChange={(v) => updateEnvironment('polar_season', v)}
            options={[
              'Polar Night',
              'Polar Day',
              'Transition'
            ]}
          />

          <InputField
            label="Solar Availability (%)"
            icon={Sun}
            value={scenario.environment.solar_availability}
            onChange={(v) => updateEnvironment('solar_availability', parseFloat(v) || 0)}
            type="number"
            min={0}
            max={100}
            step={1}
            help="0% during Polar Night"
          />
        </div>
      </ConfigSection>

      {/* Energy Demand */}
      <ConfigSection
        title="Energy Demand"
        subtitle={`Total Load: ${getTotalLoad().toFixed(1)} kW`}
        icon={Zap}
        expanded={expandedSections.has('load')}
        onToggle={() => toggleSection('load')}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-dark-surface p-2 rounded-lg border border-dark-border">
            <span className="text-sm font-medium text-gray-300">Load Definition Mode:</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setLoadMode('simple')}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded transition-colors',
                  loadMode === 'simple'
                    ? 'bg-polar-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                )}
              >
                Simple Mode
              </button>
              <button
                type="button"
                onClick={() => setLoadMode('advanced')}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded transition-colors',
                  loadMode === 'advanced'
                    ? 'bg-polar-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                )}
              >
                Advanced Mode
              </button>
            </div>
          </div>

          {loadMode === 'simple' ? (
            <div className="p-4 bg-dark-surface rounded-lg border border-dark-border">
              <InputField
                label="Total Station Load (kW)"
                value={getTotalLoad()}
                onChange={(v) => handleSimpleLoadChange(parseFloat(v) || 0)}
                type="number"
                min={0}
                max={2000}
                step={10}
                highlight
                help="Automatically proportions demand across station subsystems"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Base Load (kW)"
                value={scenario.load.base_load_kw}
                onChange={(v) => updateLoad('base_load_kw', parseFloat(v) || 0)}
                type="number"
                min={0}
                step={1}
              />

              <InputField
                label="Research Load (kW)"
                value={scenario.load.research_load_kw}
                onChange={(v) => updateLoad('research_load_kw', parseFloat(v) || 0)}
                type="number"
                min={0}
                step={1}
              />

              <InputField
                label="Habitation Load (kW)"
                value={scenario.load.habitation_load_kw}
                onChange={(v) => updateLoad('habitation_load_kw', parseFloat(v) || 0)}
                type="number"
                min={0}
                step={1}
              />

              <InputField
                label="Communication Load (kW)"
                value={scenario.load.communication_load_kw}
                onChange={(v) => updateLoad('communication_load_kw', parseFloat(v) || 0)}
                type="number"
                min={0}
                step={1}
              />

              <InputField
                label="Critical Load (kW)"
                value={scenario.load.critical_load_kw}
                onChange={(v) => updateLoad('critical_load_kw', parseFloat(v) || 0)}
                type="number"
                min={0}
                step={1}
                highlight
              />

              <InputField
                label="Deferrable Load (kW)"
                value={scenario.load.deferrable_load_kw}
                onChange={(v) => updateLoad('deferrable_load_kw', parseFloat(v) || 0)}
                type="number"
                min={0}
                step={1}
              />
            </div>
          )}
        </div>
      </ConfigSection>

      {/* Renewable Energy Inputs */}
      <ConfigSection
        title="Renewable Energy Inputs"
        subtitle={`Wind Turbines: ${scenario.renewable.wind_turbine_count} × ${scenario.renewable.wind_turbine_capacity_kw} kW`}
        icon={Wind}
        expanded={expandedSections.has('renewable')}
        onToggle={() => toggleSection('renewable')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Wind Turbine Capacity (kW)"
            value={scenario.renewable.wind_turbine_capacity_kw}
            onChange={(v) => updateRenewable('wind_turbine_capacity_kw', parseFloat(v) || 0)}
            type="number"
            min={0}
            step={10}
            help="Rated output per turbine"
          />

          <InputField
            label="Number of Turbines"
            value={scenario.renewable.wind_turbine_count}
            onChange={(v) => updateRenewable('wind_turbine_count', parseInt(v) || 0)}
            type="number"
            min={0}
            max={20}
            step={1}
          />

          <InputField
            label="Turbine Efficiency"
            value={scenario.renewable.wind_turbine_efficiency}
            onChange={(v) => updateRenewable('wind_turbine_efficiency', parseFloat(v) || 0)}
            type="number"
            min={0.1}
            max={1.0}
            step={0.05}
            help="Efficiency factor (0.1 to 1.0)"
          />

          <InputField
            label="Solar Capacity (kW)"
            value={scenario.renewable.solar_capacity_kw}
            onChange={(v) => updateRenewable('solar_capacity_kw', parseFloat(v) || 0)}
            type="number"
            min={0}
            step={5}
            help="Installed solar array capacity"
          />
        </div>
      </ConfigSection>

      {/* Battery Configuration */}
      <ConfigSection
        title="Battery Storage"
        subtitle={`Current SOC: ${scenario.battery.battery_current_soc_percent}%`}
        icon={Battery}
        expanded={expandedSections.has('battery')}
        onToggle={() => toggleSection('battery')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Capacity (kWh)"
            value={scenario.battery.battery_capacity_kwh}
            onChange={(v) => updateBattery('battery_capacity_kwh', parseFloat(v) || 0)}
            type="number"
            min={0}
            step={10}
          />

          <InputField
            label="Current SOC (%)"
            value={scenario.battery.battery_current_soc_percent}
            onChange={(v) => updateBattery('battery_current_soc_percent', parseFloat(v) || 0)}
            type="number"
            min={0}
            max={100}
            step={1}
            highlight
          />

          <InputField
            label="Max Charge Power (kW)"
            value={scenario.battery.battery_max_charge_kw}
            onChange={(v) => updateBattery('battery_max_charge_kw', parseFloat(v) || 0)}
            type="number"
            min={0}
            step={5}
          />

          <InputField
            label="Max Discharge Power (kW)"
            value={scenario.battery.battery_max_discharge_kw}
            onChange={(v) => updateBattery('battery_max_discharge_kw', parseFloat(v) || 0)}
            type="number"
            min={0}
            step={5}
          />

          <InputField
            label="Min SOC (%)"
            value={scenario.battery.battery_min_soc_percent}
            onChange={(v) => updateBattery('battery_min_soc_percent', parseFloat(v) || 0)}
            type="number"
            min={0}
            max={100}
            step={1}
          />

          <InputField
            label="Max SOC (%)"
            value={scenario.battery.battery_max_soc_percent}
            onChange={(v) => updateBattery('battery_max_soc_percent', parseFloat(v) || 0)}
            type="number"
            min={0}
            max={100}
            step={1}
          />

          <InputField
            label="Battery Temperature (°C)"
            value={scenario.battery.battery_temperature_c}
            onChange={(v) => updateBattery('battery_temperature_c', parseFloat(v) || 0)}
            type="number"
            min={-40}
            max={30}
            step={1}
            help="Sub-zero temperature degrades battery performance"
          />
        </div>
      </ConfigSection>

      {/* Generator Configuration */}
      <ConfigSection
        title="Diesel Generators"
        subtitle={`${scenario.generator.generator_count} generators configured`}
        icon={Fuel}
        expanded={expandedSections.has('generator')}
        onToggle={() => toggleSection('generator')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Generator Capacity (kW)"
            value={scenario.generator.generator_capacity_kw}
            onChange={(v) => updateGenerator('generator_capacity_kw', parseFloat(v) || 0)}
            type="number"
            min={0}
            step={10}
          />

          <InputField
            label="Minimum Load (kW)"
            value={scenario.generator.generator_min_load_kw}
            onChange={(v) => updateGenerator('generator_min_load_kw', parseFloat(v) || 0)}
            type="number"
            min={0}
            step={5}
          />

          <SelectField
            label="Generator 1 Status"
            value={scenario.generator.generator_1_status}
            onChange={(v) => updateGenerator('generator_1_status', v)}
            options={['available', 'running', 'standby', 'failed']}
          />

          <SelectField
            label="Generator 2 Status"
            value={scenario.generator.generator_2_status}
            onChange={(v) => updateGenerator('generator_2_status', v)}
            options={['available', 'running', 'standby', 'failed']}
          />

          <SelectField
            label="Generator 3 Status"
            value={scenario.generator.generator_3_status}
            onChange={(v) => updateGenerator('generator_3_status', v)}
            options={['available', 'running', 'standby', 'failed']}
          />
        </div>
      </ConfigSection>

      {/* Special Events */}
      <ConfigSection
        title="Special Events"
        subtitle="Configure failure scenarios and disturbances"
        icon={AlertTriangle}
        expanded={expandedSections.has('events')}
        onToggle={() => toggleSection('events')}
      >
        <div className="space-y-4">
          {/* Generator Failure */}
          <div className="flex items-start space-x-3 p-4 bg-dark-surface rounded-lg border border-dark-border">
            <input
              type="checkbox"
              checked={scenario.events.enable_generator_failure}
              onChange={(e) => updateEvents('enable_generator_failure', e.target.checked)}
              className="mt-1 accent-polar-500"
            />
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-200">
                Generator Failure Event
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Simulate generator failure during simulation
              </p>
              {scenario.events.enable_generator_failure && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <InputField
                    label="Failure Hour"
                    value={scenario.events.generator_failure_hour}
                    onChange={(v) => updateEvents('generator_failure_hour', parseInt(v) || 0)}
                    type="number"
                    min={0}
                    small
                  />
                  <InputField
                    label="Generator ID"
                    value={scenario.events.generator_failure_id}
                    onChange={(v) => updateEvents('generator_failure_id', parseInt(v) || 1)}
                    type="number"
                    min={1}
                    max={3}
                    small
                  />
                </div>
              )}
            </div>
          </div>

          {/* Load Spike */}
          <div className="flex items-start space-x-3 p-4 bg-dark-surface rounded-lg border border-dark-border">
            <input
              type="checkbox"
              checked={scenario.events.enable_load_spike}
              onChange={(e) => updateEvents('enable_load_spike', e.target.checked)}
              className="mt-1 accent-polar-500"
            />
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-200">
                Load Spike Event
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Sudden increase in electricity demand
              </p>
              {scenario.events.enable_load_spike && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <InputField
                    label="Spike Hour"
                    value={scenario.events.load_spike_hour}
                    onChange={(v) => updateEvents('load_spike_hour', parseInt(v) || 0)}
                    type="number"
                    min={0}
                    small
                  />
                  <InputField
                    label="Multiplier"
                    value={scenario.events.load_spike_multiplier}
                    onChange={(v) => updateEvents('load_spike_multiplier', parseFloat(v) || 1)}
                    type="number"
                    min={1}
                    max={3}
                    step={0.1}
                    small
                  />
                </div>
              )}
            </div>
          </div>

          {/* Wind Drop */}
          <div className="flex items-start space-x-3 p-4 bg-dark-surface rounded-lg border border-dark-border">
            <input
              type="checkbox"
              checked={scenario.events.enable_wind_drop}
              onChange={(e) => updateEvents('enable_wind_drop', e.target.checked)}
              className="mt-1 accent-polar-500"
            />
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-200">
                Wind Generation Drop
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Sudden decrease in wind power
              </p>
              {scenario.events.enable_wind_drop && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <InputField
                    label="Drop Hour"
                    value={scenario.events.wind_drop_hour}
                    onChange={(v) => updateEvents('wind_drop_hour', parseInt(v) || 0)}
                    type="number"
                    min={0}
                    small
                  />
                  <InputField
                    label="Multiplier"
                    value={scenario.events.wind_drop_multiplier}
                    onChange={(v) => updateEvents('wind_drop_multiplier', parseFloat(v) || 0)}
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    small
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </ConfigSection>

      {/* Simulation Parameters */}
      <ConfigSection
        title="Simulation Parameters"
        subtitle="Duration and optimization settings"
        icon={Settings}
        expanded={expandedSections.has('parameters')}
        onToggle={() => toggleSection('parameters')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Duration (hours)"
            icon={Clock}
            value={scenario.parameters.duration_hours}
            onChange={(v) => updateParameters('duration_hours', parseInt(v) || 24)}
            type="number"
            min={1}
            max={168}
            step={1}
          />

          <InputField
            label="Reserve Margin (%)"
            value={scenario.parameters.reserve_margin_percent}
            onChange={(v) => updateParameters('reserve_margin_percent', parseFloat(v) || 0)}
            type="number"
            min={0}
            max={50}
            step={1}
          />

          <div className="col-span-2 space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg border border-dark-border">
              <input
                type="checkbox"
                checked={scenario.parameters.enable_ai_optimization}
                onChange={(e) => updateParameters('enable_ai_optimization', e.target.checked)}
                className="accent-polar-500"
              />
              <label className="text-sm font-medium text-gray-200">
                Enable AI Optimization
              </label>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg border border-dark-border">
              <input
                type="checkbox"
                checked={scenario.parameters.enable_baseline_comparison}
                onChange={(e) => updateParameters('enable_baseline_comparison', e.target.checked)}
                className="accent-polar-500"
              />
              <label className="text-sm font-medium text-gray-200">
                Enable Baseline Comparison
              </label>
            </div>
          </div>
        </div>
      </ConfigSection>
    </div>
  );
}

// Helper Components

interface ConfigSectionProps {
  title: string;
  subtitle: string;
  icon: any;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ConfigSection({ title, subtitle, icon: Icon, expanded, onToggle, children }: ConfigSectionProps) {
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-dark-hover transition-colors text-left"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-polar-600/20 rounded-lg flex items-center justify-center">
            <Icon size={20} className="text-polar-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-100">{title}</h3>
            <p className="text-sm text-gray-400">{subtitle}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 pt-0 border-t border-dark-border">
          {children}
        </div>
      )}
    </Card>
  );
}

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number | string;
  icon?: any;
  help?: string;
  highlight?: boolean;
  small?: boolean;
}

function InputField({ label, value, onChange, type = 'number', min, max, step, icon: Icon, help, highlight, small }: InputFieldProps) {
  return (
    <div>
      <label className={cn('block text-sm font-medium text-gray-300 mb-1', small && 'text-xs')}>
        {Icon && <Icon size={14} className="inline mr-1" />}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        className={cn(
          'w-full px-3 py-2 bg-dark-surface border rounded-lg',
          'text-gray-100 placeholder-gray-500',
          'focus:outline-none focus:ring-2 transition-colors',
          highlight
            ? 'border-polar-600/50 focus:border-polar-600 focus:ring-polar-600/20'
            : 'border-dark-border focus:border-dark-accent focus:ring-polar-600/10',
          small && 'py-1.5 text-sm'
        )}
      />
      {help && (
        <p className="text-xs text-gray-500 mt-1">{help}</p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  icon?: any;
}

function SelectField({ label, value, onChange, options, icon: Icon }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {Icon && <Icon size={14} className="inline mr-1" />}
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:border-polar-600 focus:ring-polar-600/10 transition-colors"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
