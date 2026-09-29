/**
 * Demo Store - Global State Management for Interactive Demo
 * 
 * Manages realistic state changes throughout the demo flow
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SystemState {
  // Current measurements
  currentLoad: number;
  windGeneration: number;
  dieselGeneration: number;
  batterySoc: number;
  batteryPower: number;
  
  // Weather
  temperature: number;
  windSpeed: number;
  weatherCondition: string;
  
  // System status
  generatorStatus: 'online' | 'standby' | 'offline';
  batteryStatus: 'charging' | 'discharging' | 'idle';
  systemStatus: 'normal' | 'warning' | 'critical';
  
  // Alerts
  activeAlerts: number;
  unreadAlerts: number;
  
  // Scenario state
  activeScenario: string | null;
  scenarioProgress: number;
  isRecovering: boolean;
  
  // Time control
  selectedTimeRange: '24h' | '7d' | '30d' | 'custom';
  currentHour: number;
}

interface DemoStore extends SystemState {
  // Actions
  updateSystemState: (updates: Partial<SystemState>) => void;
  simulateWindIncrease: () => void;
  simulateGeneratorFailure: () => void;
  simulateRecovery: () => void;
  runOptimization: () => void;
  acceptRecommendation: (id: string) => void;
  dismissAlert: (id: number) => void;
  setTimeRange: (range: '24h' | '7d' | '30d' | 'custom') => void;
  advanceTime: () => void;
  resetDemo: () => void;
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      // Initial state - Normal operation
      currentLoad: 105.5,
      windGeneration: 45.3,
      dieselGeneration: 62.2,
      batterySoc: 68.0,
      batteryPower: -15.5, // Charging
      
      temperature: -18.5,
      windSpeed: 9.2,
      weatherCondition: 'Clear',
      
      generatorStatus: 'online',
      batteryStatus: 'charging',
      systemStatus: 'normal',
      
      activeAlerts: 2,
      unreadAlerts: 2,
      
      activeScenario: null,
      scenarioProgress: 0,
      isRecovering: false,
      
      selectedTimeRange: '24h',
      currentHour: new Date().getHours(),
      
      // Update system state
      updateSystemState: (updates) => set((state) => ({ ...state, ...updates })),
      
      // Simulate high wind event
      simulateWindIncrease: () => {
        set({
          windSpeed: 15.8,
          windGeneration: 85.0,
          dieselGeneration: 25.0,
          batterySoc: 72.0,
          batteryPower: -18.5,
          batteryStatus: 'charging',
          systemStatus: 'normal',
          activeAlerts: 1,
          unreadAlerts: 1,
        });
      },
      
      // Simulate generator failure scenario
      simulateGeneratorFailure: () => {
        set({
          activeScenario: 'generator_failure',
          scenarioProgress: 0,
          generatorStatus: 'offline',
          dieselGeneration: 0,
          batteryStatus: 'discharging',
          batteryPower: 45.0,
          batterySoc: 65.0,
          systemStatus: 'warning',
          activeAlerts: 3,
          unreadAlerts: 3,
          isRecovering: false,
        });
        
        // Simulate progressive discharge
        setTimeout(() => {
          set(() => ({
            scenarioProgress: 25,
            batterySoc: 58.0,
            batteryPower: 50.0,
          }));
        }, 1000);
        
        setTimeout(() => {
          set(() => ({
            scenarioProgress: 50,
            batterySoc: 52.0,
            systemStatus: 'warning',
          }));
        }, 2000);
      },
      
      // Simulate recovery from failure
      simulateRecovery: () => {
        set({
          isRecovering: true,
          scenarioProgress: 60,
        });
        
        setTimeout(() => {
          set({
            scenarioProgress: 75,
            generatorStatus: 'standby',
            systemStatus: 'warning',
          });
        }, 1000);
        
        setTimeout(() => {
          set({
            scenarioProgress: 100,
            generatorStatus: 'online',
            dieselGeneration: 40.0,
            batteryStatus: 'charging',
            batteryPower: -12.0,
            batterySoc: 54.0,
            systemStatus: 'normal',
            activeAlerts: 1,
            activeScenario: null,
            isRecovering: false,
          });
        }, 2500);
      },
      
      // Run optimization
      runOptimization: () => {
        // Simulate optimization improving efficiency
        set((state) => ({
          dieselGeneration: Math.max(0, state.dieselGeneration - 15),
          batteryPower: state.windGeneration > state.currentLoad ? -20 : 10,
          systemStatus: 'normal',
        }));
      },
      
      // Accept recommendation
      acceptRecommendation: (id) => {
        const state = get();
        
        // Simulate implementing recommendation
        if (id.includes('wind')) {
          set({
            dieselGeneration: Math.max(20, state.dieselGeneration - 20),
            batteryPower: -22.0,
            batteryStatus: 'charging',
          });
        } else if (id.includes('battery')) {
          set({
            batteryPower: state.batteryPower > 0 ? -15 : -25,
            batteryStatus: 'charging',
          });
        }
      },
      
      // Dismiss alert
      dismissAlert: (_id) => {
        set((state) => ({
          activeAlerts: Math.max(0, state.activeAlerts - 1),
          unreadAlerts: Math.max(0, state.unreadAlerts - 1),
        }));
      },
      
      // Set time range
      setTimeRange: (range) => {
        set({ selectedTimeRange: range });
      },
      
      // Advance time (for simulation)
      advanceTime: () => {
        set((state) => ({
          currentHour: (state.currentHour + 1) % 24,
        }));
      },
      
      // Reset to initial state
      resetDemo: () => {
        set({
          currentLoad: 105.5,
          windGeneration: 45.3,
          dieselGeneration: 62.2,
          batterySoc: 68.0,
          batteryPower: -15.5,
          temperature: -18.5,
          windSpeed: 9.2,
          weatherCondition: 'Clear',
          generatorStatus: 'online',
          batteryStatus: 'charging',
          systemStatus: 'normal',
          activeAlerts: 2,
          unreadAlerts: 2,
          activeScenario: null,
          scenarioProgress: 0,
          isRecovering: false,
          selectedTimeRange: '24h',
          currentHour: new Date().getHours(),
        });
      },
    }),
    {
      name: 'polar-ems-demo',
    }
  )
);
