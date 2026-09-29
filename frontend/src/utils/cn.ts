/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx for conditional classes
 */

import clsx, { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
