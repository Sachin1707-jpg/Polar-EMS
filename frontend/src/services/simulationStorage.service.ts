/**
 * Simulation Storage Service
 * LocalStorage-based persistence for simulation history and configurations
 */
import { SimulationRequest, SimulationResponse, ComparisonResponse } from './api/simulation.service';

export interface StoredSimulation {
  id: string;
  name: string;
  timestamp: string;
  config: SimulationRequest;
  result?: SimulationResponse;
  comparison?: ComparisonResponse;
  tags: string[];
  notes?: string;
}

const STORAGE_KEY = 'polar_ems_simulations';
const MAX_HISTORY = 50;

class SimulationStorageService {
  /**
   * Save a simulation to history
   */
  saveSimulation(
    name: string,
    config: SimulationRequest,
    result?: SimulationResponse,
    comparison?: ComparisonResponse,
    tags: string[] = [],
    notes?: string
  ): StoredSimulation {
    const simulation: StoredSimulation = {
      id: this.generateId(),
      name,
      timestamp: new Date().toISOString(),
      config,
      result,
      comparison,
      tags,
      notes
    };

    const history = this.getHistory();
    history.unshift(simulation);

    // Keep only the most recent simulations
    if (history.length > MAX_HISTORY) {
      history.splice(MAX_HISTORY);
    }

    this.saveHistory(history);
    return simulation;
  }

  /**
   * Get all simulation history
   */
  getHistory(): StoredSimulation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load simulation history:', error);
      return [];
    }
  }

  /**
   * Get simulation by ID
   */
  getSimulation(id: string): StoredSimulation | null {
    const history = this.getHistory();
    return history.find(sim => sim.id === id) || null;
  }

  /**
   * Update simulation
   */
  updateSimulation(id: string, updates: Partial<StoredSimulation>): boolean {
    const history = this.getHistory();
    const index = history.findIndex(sim => sim.id === id);
    
    if (index === -1) return false;

    history[index] = { ...history[index], ...updates };
    this.saveHistory(history);
    return true;
  }

  /**
   * Delete simulation
   */
  deleteSimulation(id: string): boolean {
    const history = this.getHistory();
    const filtered = history.filter(sim => sim.id !== id);
    
    if (filtered.length === history.length) return false;

    this.saveHistory(filtered);
    return true;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Search simulations
   */
  searchSimulations(query: string): StoredSimulation[] {
    const history = this.getHistory();
    const lowerQuery = query.toLowerCase();

    return history.filter(sim => 
      sim.name.toLowerCase().includes(lowerQuery) ||
      sim.notes?.toLowerCase().includes(lowerQuery) ||
      sim.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      sim.config.scenario_name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Filter by tags
   */
  filterByTags(tags: string[]): StoredSimulation[] {
    const history = this.getHistory();
    return history.filter(sim =>
      tags.some(tag => sim.tags.includes(tag))
    );
  }

  /**
   * Get recent simulations
   */
  getRecent(count: number = 10): StoredSimulation[] {
    const history = this.getHistory();
    return history.slice(0, count);
  }

  /**
   * Export simulation as JSON
   */
  exportSimulation(id: string): string | null {
    const simulation = this.getSimulation(id);
    if (!simulation) return null;

    return JSON.stringify(simulation, null, 2);
  }

  /**
   * Import simulation from JSON
   */
  importSimulation(jsonData: string): StoredSimulation | null {
    try {
      const simulation = JSON.parse(jsonData) as StoredSimulation;
      
      // Generate new ID and timestamp
      simulation.id = this.generateId();
      simulation.timestamp = new Date().toISOString();

      const history = this.getHistory();
      history.unshift(simulation);
      this.saveHistory(history);

      return simulation;
    } catch (error) {
      console.error('Failed to import simulation:', error);
      return null;
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const history = this.getHistory();
    
    const totalSimulations = history.length;
    const withResults = history.filter(sim => sim.result).length;
    const withComparisons = history.filter(sim => sim.comparison).length;

    const allTags = history.flatMap(sim => sim.tags);
    const uniqueTags = Array.from(new Set(allTags));

    const scenarioCounts = history.reduce((acc, sim) => {
      const scenario = sim.config.scenario_name;
      acc[scenario] = (acc[scenario] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSimulations,
      withResults,
      withComparisons,
      uniqueTags,
      scenarioCounts,
      oldestTimestamp: history[history.length - 1]?.timestamp,
      newestTimestamp: history[0]?.timestamp
    };
  }

  /**
   * Duplicate simulation (for What-If analysis)
   */
  duplicateSimulation(id: string, newName?: string): StoredSimulation | null {
    const original = this.getSimulation(id);
    if (!original) return null;

    const duplicate: StoredSimulation = {
      ...original,
      id: this.generateId(),
      name: newName || `${original.name} (Copy)`,
      timestamp: new Date().toISOString(),
      result: undefined,
      comparison: undefined
    };

    const history = this.getHistory();
    history.unshift(duplicate);
    this.saveHistory(history);

    return duplicate;
  }

  // Private helpers

  private saveHistory(history: StoredSimulation[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save simulation history:', error);
      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Remove oldest simulations and retry
        history.splice(Math.floor(history.length / 2));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError);
        }
      }
    }
  }

  private generateId(): string {
    return `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const simulationStorage = new SimulationStorageService();
