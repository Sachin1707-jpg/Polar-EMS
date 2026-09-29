/**
 * Data Mode Indicator Component
 * Shows current data mode (Simulation or Live) with toggle
 */

import { Activity, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './Badge';
import { useDataMode } from '@/contexts/DataModeContext';
import { cn } from '@/utils/cn';

interface DataModeIndicatorProps {
  showToggle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DataModeIndicator({ showToggle = false, size = 'lg' }: DataModeIndicatorProps) {
  const { setDataMode, isSimulation, isLive } = useDataMode();
  const navigate = useNavigate();

  if (showToggle) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            setDataMode('simulation');
            navigate('/simulation');
          }}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded transition-colors',
            isSimulation
              ? 'bg-status-info text-white'
              : 'text-gray-400 hover:text-gray-300 hover:bg-dark-hover'
          )}
        >
          <Database size={14} className="inline mr-1" />
          Simulation
        </button>
        <button
          onClick={() => setDataMode('live')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded transition-colors',
            isLive
              ? 'bg-status-success text-white'
              : 'text-gray-400 hover:text-gray-300 hover:bg-dark-hover'
          )}
        >
          <Activity size={14} className="inline mr-1" />
          Live
        </button>
      </div>
    );
  }

  return (
    <Badge
      variant={isSimulation ? 'info' : 'success'}
      size={size}
    >
      {isSimulation ? (
        <>
          <span className="mr-1">🔬</span>
          SIMULATION
        </>
      ) : (
        <>
          <Activity size={16} className="mr-1" />
          LIVE DATA
        </>
      )}
    </Badge>
  );
}
