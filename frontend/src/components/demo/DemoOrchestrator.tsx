/**
 * Demo Orchestrator Component
 * Provides guided demo flow with interactive tooltips
 */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Play, RotateCcw } from 'lucide-react';
import { useDemoStore } from '@/stores/demoStore';
import { cn } from '@/utils/cn';

interface DemoStep {
  id: string;
  route: string;
  title: string;
  description: string;
  action?: () => void;
  waitForAction?: boolean;
}

const demoSteps: DemoStep[] = [
  {
    id: 'landing',
    route: '/',
    title: 'Welcome to POLAR-EMS',
    description: 'AI-powered energy management for Antarctic research stations. Click "Enter System" to begin.',
  },
  {
    id: 'dashboard',
    route: '/dashboard',
    title: 'Mission Control',
    description: 'Monitor real-time system status. Note the current renewable share and battery SOC.',
  },
  {
    id: 'weather',
    route: '/weather',
    title: 'Weather Intelligence',
    description: 'Check current weather conditions and forecasts. Notice wind speed affects power generation.',
  },
  {
    id: 'forecasts',
    route: '/forecasts',
    title: 'AI Forecasting',
    description: 'Review 24-hour load and wind power predictions. These drive optimization decisions.',
  },
  {
    id: 'recommendations',
    route: '/recommendations',
    title: 'AI Recommendations',
    description: 'View AI-generated suggestions. Try accepting a recommendation to see the impact.',
    waitForAction: true,
  },
  {
    id: 'optimization',
    route: '/optimization',
    title: 'Energy Optimization',
    description: 'Run AI optimization to get optimal dispatch schedule. Click "Run Optimization" button.',
    waitForAction: true,
  },
  {
    id: 'optimization-results',
    route: '/optimization',
    title: 'Baseline vs AI Comparison',
    description: 'See fuel savings and renewable increase from AI optimization.',
  },
  {
    id: 'emergency',
    route: '/emergency',
    title: 'Failure Simulation',
    description: 'Test system resilience. Click "Simulate Generator Failure" to see AI response.',
    waitForAction: true,
  },
  {
    id: 'emergency-recovery',
    route: '/emergency',
    title: 'AI-Driven Recovery',
    description: 'Watch AI automatically manage the failure. Battery takes over, critical loads protected.',
  },
  {
    id: 'analytics',
    route: '/analytics',
    title: 'Performance Analytics',
    description: 'Review system performance metrics and baseline comparison.',
  },
];

export function DemoOrchestrator() {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const resetDemo = useDemoStore((state) => state.resetDemo);
  
  const currentStep = demoSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / demoSteps.length) * 100;
  
  useEffect(() => {
    // Check if we should activate demo mode from localStorage
    const demoMode = localStorage.getItem('demo_mode');
    if (demoMode === 'active') {
      setIsActive(true);
    }
  }, []);
  
  useEffect(() => {
    // Auto-advance if route matches and not waiting for action
    if (isActive && currentStep && location.pathname === currentStep.route) {
      if (!currentStep.waitForAction) {
        // Small delay to let user read
        const timer = setTimeout(() => {
          // Don't auto-advance on last step
          if (currentStepIndex < demoSteps.length - 1) {
            // Auto-navigate after 3 seconds unless it's an action step
            const navTimer = setTimeout(() => {
              handleNext();
            }, 3000);
            
            return () => clearTimeout(navTimer);
          }
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isActive, currentStep, location.pathname, currentStepIndex]);
  
  const startDemo = () => {
    resetDemo();
    setIsActive(true);
    setCurrentStepIndex(0);
    localStorage.setItem('demo_mode', 'active');
    navigate('/');
  };
  
  const endDemo = () => {
    setIsActive(false);
    localStorage.removeItem('demo_mode');
    resetDemo();
  };
  
  const handleNext = () => {
    if (currentStepIndex < demoSteps.length - 1) {
      const nextStep = demoSteps[currentStepIndex + 1];
      setCurrentStepIndex(currentStepIndex + 1);
      
      // Execute step action if defined
      if (nextStep.action) {
        nextStep.action();
      }
      
      // Navigate to next route
      if (nextStep.route !== location.pathname) {
        navigate(nextStep.route);
      }
    } else {
      // Demo complete
      endDemo();
      navigate('/analytics');
    }
  };
  
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStep = demoSteps[currentStepIndex - 1];
      setCurrentStepIndex(currentStepIndex - 1);
      
      if (prevStep.route !== location.pathname) {
        navigate(prevStep.route);
      }
    }
  };
  
  const handleStepClick = (index: number) => {
    const step = demoSteps[index];
    setCurrentStepIndex(index);
    
    if (step.action) {
      step.action();
    }
    
    navigate(step.route);
  };
  
  if (!isActive) {
    // Show "Start Demo" button
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={startDemo}
          className="bg-polar-500 hover:bg-polar-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 transition-all hover:scale-105"
        >
          <Play size={20} />
          <span className="font-medium">Start Guided Demo</span>
        </button>
      </div>
    );
  }
  
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-dark-surface border border-polar-500 text-gray-100 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
        >
          <Play size={16} />
          <span className="text-sm">Demo: Step {currentStepIndex + 1}/{demoSteps.length}</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      <div className="bg-dark-surface border-2 border-polar-500 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-polar-600 to-polar-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Play size={16} className="text-white" />
            <span className="text-white font-semibold text-sm">Guided Demo</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
              title="Minimize"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={endDemo}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
              title="End Demo"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-dark-card">
          <div
            className="h-full bg-polar-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-100">
              {currentStep.title}
            </h3>
            <span className="text-xs text-gray-400">
              Step {currentStepIndex + 1} of {demoSteps.length}
            </span>
          </div>
          
          <p className="text-sm text-gray-300 mb-4">
            {currentStep.description}
          </p>
          
          {currentStep.waitForAction && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2 mb-4">
              <p className="text-xs text-yellow-200">
                ⏳ Waiting for you to complete this action...
              </p>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className={cn(
                "px-3 py-1.5 rounded text-sm flex items-center space-x-1 transition-colors",
                currentStepIndex === 0
                  ? "bg-dark-card text-gray-500 cursor-not-allowed"
                  : "bg-dark-hover text-gray-200 hover:bg-dark-card"
              )}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            
            <button
              onClick={() => {
                resetDemo();
                setCurrentStepIndex(0);
                navigate('/');
              }}
              className="px-3 py-1.5 rounded text-sm flex items-center space-x-1 bg-dark-hover text-gray-200 hover:bg-dark-card transition-colors"
              title="Restart Demo"
            >
              <RotateCcw size={14} />
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentStep.waitForAction}
              className={cn(
                "px-3 py-1.5 rounded text-sm flex items-center space-x-1 transition-colors",
                currentStep.waitForAction
                  ? "bg-dark-card text-gray-500 cursor-not-allowed"
                  : currentStepIndex === demoSteps.length - 1
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-polar-500 text-white hover:bg-polar-600"
              )}
            >
              <span>{currentStepIndex === demoSteps.length - 1 ? 'Finish' : 'Next'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        
        {/* Step Dots */}
        <div className="px-4 pb-4">
          <div className="flex items-center space-x-1">
            {demoSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={cn(
                  "h-2 rounded-full transition-all flex-1",
                  index === currentStepIndex
                    ? "bg-polar-400"
                    : index < currentStepIndex
                    ? "bg-polar-600"
                    : "bg-dark-card"
                )}
                title={step.title}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
