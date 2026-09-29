/**
 * Formatting utilities for POLAR-EMS
 * Professional data formatting for energy, power, fuel, and environmental metrics
 */

/**
 * Format power values in kW
 */
export function formatPower(kw: number | undefined | null): string {
  if (kw === null || kw === undefined) return 'N/A';
  
  if (Math.abs(kw) >= 1000) {
    return `${(kw / 1000).toFixed(2)} MW`;
  }
  
  return `${kw.toFixed(2)} kW`;
}

/**
 * Format energy values in kWh
 */
export function formatEnergy(kwh: number | undefined | null): string {
  if (kwh === null || kwh === undefined) return 'N/A';
  
  if (Math.abs(kwh) >= 1000) {
    return `${(kwh / 1000).toFixed(2)} MWh`;
  }
  
  return `${kwh.toFixed(2)} kWh`;
}

/**
 * Format percentage values
 */
export function formatPercent(value: number | undefined | null, decimals: number = 1): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format fuel consumption in liters
 */
export function formatFuel(liters: number | undefined | null): string {
  if (liters === null || liters === undefined) return 'N/A';
  return `${liters.toFixed(1)} L`;
}

/**
 * Format fuel consumption rate in liters per hour
 */
export function formatFuelRate(lph: number | undefined | null): string {
  if (lph === null || lph === undefined) return 'N/A';
  return `${lph.toFixed(2)} L/h`;
}

/**
 * Format temperature in Celsius
 */
export function formatTemperature(celsius: number | undefined | null): string {
  if (celsius === null || celsius === undefined) return 'N/A';
  return `${celsius.toFixed(1)}°C`;
}

/**
 * Format wind speed in m/s with optional conversion to km/h
 */
export function formatWindSpeed(ms: number | undefined | null, showKmh: boolean = false): string {
  if (ms === null || ms === undefined) return 'N/A';
  
  if (showKmh) {
    const kmh = ms * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  }
  
  return `${ms.toFixed(1)} m/s`;
}

/**
 * Format pressure in hPa
 */
export function formatPressure(hpa: number | undefined | null): string {
  if (hpa === null || hpa === undefined) return 'N/A';
  return `${hpa.toFixed(0)} hPa`;
}

/**
 * Format CO2 emissions in kg
 */
export function formatCO2(kg: number | undefined | null): string {
  if (kg === null || kg === undefined) return 'N/A';
  
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} t`;
  }
  
  return `${kg.toFixed(1)} kg`;
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number | undefined | null, currency: string = 'USD'): string {
  if (amount === null || amount === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format numbers with thousand separators
 */
export function formatNumber(value: number | undefined | null, decimals: number = 0): string {
  if (value === null || value === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format date/time for display
 */
export function formatDateTime(date: string | Date | undefined | null, includeTime: boolean = true): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  if (includeTime) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | undefined | null): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return formatDateTime(d, false);
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number | undefined | null): string {
  if (seconds === null || seconds === undefined) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  
  return `${secs}s`;
}

/**
 * Format trend value with sign
 */
export function formatTrend(value: number | undefined | null, unit: string = '%'): string {
  if (value === null || value === undefined) return 'N/A';
  
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}${unit}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
