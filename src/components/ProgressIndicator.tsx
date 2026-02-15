import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
}

const STEPS = [
  { number: 1, label: 'Access' },
  { number: 2, label: 'Complete Profile' },
  { number: 3, label: 'Book Travel' },
];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isUpcoming = step.number > currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.number} className="flex items-center">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-medium mb-2
                    ${isCompleted
                      ? 'bg-[#B3802B] text-white'
                      : isActive
                        ? 'border-2 border-[#B3802B] border-solid text-[#B3802B]'
                        : 'border-2 border-gray-300 border-solid text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isUpcoming ? 'text-gray-400' : 'text-[#121110]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`w-24 h-px mx-2 mb-6 ${
                    isCompleted ? 'bg-[#B3802B]' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
