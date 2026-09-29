/**
 * Utility Helper Functions
 */
import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format number with unit
 */
export const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  return Number(value).toFixed(decimals);
};

/**
 * Format power value
 */
export const formatPower = (kw, decimals = 1) => {
  if (kw === null || kw === undefined) return '-';
  return `${formatNumber(kw, decimals)} kW`;
};

/**
 * Format energy value
 */
export const formatEnergy = (kwh, decimals = 1) => {
  if (kwh === null || kwh === undefined) return '-';
  return `${formatNumber(kwh, decimals)} kWh`;
};

/**
 * Format fuel volume
 */
export const formatFuel = (liters, decimals = 1) => {
  if (liters === null || liters === undefined) return '-';
  return `${formatNumber(liters, decimals)} L`;
};

/**
 * Format percentage
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  return `${formatNumber(value, decimals)}%`;
};

/**
 * Format temperature
 */
export const formatTemperature = (celsius, decimals = 1) => {
  if (celsius === null || celsius === undefined) return '-';
  return `${formatNumber(celsius, decimals)}°C`;
};

/**
 * Format wind speed
 */
export const formatWindSpeed = (ms, decimals = 1) => {
  if (ms === null || ms === undefined) return '-';
  return `${formatNumber(ms, decimals)} m/s`;
};

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

/**
 * Format time only
 */
export const formatTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'HH:mm');
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Get status color class
 */
export const getStatusColor = (status) => {
  const colors = {
    normal: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
    running: 'text-green-400',
    stopped: 'text-gray-400',
    maintenance: 'text-yellow-400',
    failed: 'text-red-400',
  };
  return colors[status?.toLowerCase()] || 'text-gray-400';
};

/**
 * Get status background color
 */
export const getStatusBgColor = (status) => {
  const colors = {
    normal: 'bg-green-900/30 border-green-700',
    warning: 'bg-yellow-900/30 border-yellow-700',
    critical: 'bg-red-900/30 border-red-700',
    info: 'bg-blue-900/30 border-blue-700',
  };
  return colors[status?.toLowerCase()] || 'bg-gray-900/30 border-gray-700';
};

/**
 * Get severity badge class
 */
export const getSeverityBadge = (severity) => {
  const badges = {
    critical: 'badge-danger',
    high: 'badge-danger',
    warning: 'badge-warning',
    medium: 'badge-warning',
    info: 'badge-info',
    low: 'badge-info',
  };
  return badges[severity?.toLowerCase()] || 'badge-info';
};

/**
 * Get priority badge class
 */
export const getPriorityBadge = (priority) => {
  return getSeverityBadge(priority);
};

/**
 * Calculate energy efficiency
 */
export const calculateEfficiency = (output, input) => {
  if (!input || input === 0) return 0;
  return (output / input) * 100;
};

/**
 * Calculate renewable percentage
 */
export const calculateRenewablePercent = (renewable, total) => {
  if (!total || total === 0) return 0;
  return (renewable / total) * 100;
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Class name helper (like clsx)
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Get equipment icon name based on type
 */
export const getEquipmentIcon = (type) => {
  const icons = {
    diesel_generator: 'Zap',
    battery: 'Battery',
    wind_turbine: 'Wind',
    load: 'Activity',
  };
  return icons[type] || 'Box';
};

/**
 * Check if data is simulated and return appropriate label
 */
export const getSimulatedBadge = (isSimulated) => {
  return isSimulated ? (
    <span className="simulated-badge">
      <span className="mr-1">🔬</span>
      SIMULATED DATA
    </span>
  ) : null;
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Download data as JSON
 */
export const downloadJSON = (data, filename = 'data.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download data as CSV
 */
export const downloadCSV = (data, filename = 'data.csv') => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
