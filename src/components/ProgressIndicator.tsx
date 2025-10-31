import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = [
    { 
      number: 1, 
      label: 'Access',
      caption: 'Sign in or continue with phone, email, or tag.'
    },
    { 
      number: 2, 
      label: 'Trip Details',
      caption: 'Set pickup, destination, and service level.'
    },
    { 
      number: 3, 
      label: 'Checkout',
      caption: 'Review and complete payment.'
    }
  ];

  const getStepState = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'upcoming';
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-start justify-between max-w-md mx-auto relative bc-progress-line">
        {steps.map((step, index) => {
          const state = getStepState(step.number);
          
          return (
            <div key={step.number} className="flex flex-col items-center relative flex-1">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div 
                  className={`absolute top-[14px] sm:top-[18px] left-1/2 h-0.5 transition-all duration-300 ease-in-out ${
                    state === 'completed' 
                      ? 'bg-[#C8A654] w-full' 
                      : step.number < currentStep
                      ? 'bg-[#C8A654] w-full'
                      : 'bg-gray-200 w-full'
                  }`}
                  style={{ 
                    width: 'calc(100% - 20px)',
                    left: 'calc(50% + 10px)'
                  }}
                />
              )}
              
              {/* Circle */}
              <div className="relative z-10 mb-2 sm:mb-3">
                <div
                  className={`
                    border w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
                    transition-all duration-150 ease-in-out
                    ${state === 'active' 
                      ? 'bg-[#C8A654] text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]' 
                      : state === 'completed'
                      ? 'bg-[#C8A654] text-white'
                      : 'bg-white border-2 border-gray-200 text-gray-400'
                    }
                  `}
                >
                  {state === 'completed' ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                  ) : (
                    <span className="text-sm sm:text-base font-medium">
                      {step.number}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Label */}
              <div className="text-center">
                <div
                  className={`
                    text-xs sm:text-sm transition-colors duration-150
                    ${state === 'active' || state === 'completed'
                      ? 'text-[#111111] font-medium'
                      : 'text-[#9CA3AF]'
                    }
                  `}
                >
                  {step.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
