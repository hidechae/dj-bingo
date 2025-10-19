import { GameStatus } from "~/types";

type StatusStepperProps = {
  currentStatus: GameStatus;
};

const steps = [
  { status: GameStatus.EDITING, label: "編集中", shortLabel: "編集" },
  { status: GameStatus.ENTRY, label: "エントリー中", shortLabel: "エントリー" },
  { status: GameStatus.PLAYING, label: "ゲーム中", shortLabel: "ゲーム" },
  { status: GameStatus.FINISHED, label: "終了", shortLabel: "終了" },
];

export const StatusStepper = ({ currentStatus }: StatusStepperProps) => {
  const currentIndex = steps.findIndex((step) => step.status === currentStatus);

  const getStepStyles = (stepIndex: number, status: GameStatus) => {
    const isCurrent = status === currentStatus;
    const isCompleted = stepIndex < currentIndex;

    if (isCurrent) {
      // Current step - prominent with color based on status
      switch (status) {
        case GameStatus.EDITING:
          return {
            circle: "bg-gray-600 text-white border-gray-600",
            text: "text-gray-900 font-semibold",
          };
        case GameStatus.ENTRY:
          return {
            circle: "bg-blue-600 text-white border-blue-600",
            text: "text-blue-700 font-semibold",
          };
        case GameStatus.PLAYING:
          return {
            circle: "bg-green-600 text-white border-green-600",
            text: "text-green-700 font-semibold",
          };
        case GameStatus.FINISHED:
          return {
            circle: "bg-red-600 text-white border-red-600",
            text: "text-red-700 font-semibold",
          };
      }
    }

    if (isCompleted) {
      // Completed steps - subtle filled
      return {
        circle: "bg-gray-400 text-white border-gray-400",
        text: "text-gray-600",
      };
    }

    // Future steps
    return {
      circle: "bg-white text-gray-400 border-gray-300",
      text: "text-gray-400",
    };
  };

  const getLineStyles = (stepIndex: number) => {
    if (stepIndex < currentIndex) {
      return "bg-gray-400"; // Completed
    }
    return "bg-gray-300"; // Future
  };

  return (
    <div className="flex w-full justify-center bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="flex">
          {steps.map((step, index) => {
            const styles = getStepStyles(index, step.status);

            return (
              <div
                key={step.status}
                className="flex flex-1 flex-col items-center"
              >
                {/* Circle and Line Row */}
                <div className="flex w-full items-center">
                  {/* Left Half Line */}
                  <div className="flex-1">
                    {index > 0 && (
                      <div
                        className={`h-0.5 w-full transition-colors ${getLineStyles(
                          index - 1
                        )}`}
                      />
                    )}
                  </div>

                  {/* Circle */}
                  <div
                    className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all sm:h-10 sm:w-10 sm:text-base ${styles.circle}`}
                    aria-label={step.label}
                  >
                    {index < currentIndex ? (
                      <svg
                        className="h-5 w-5 sm:h-6 sm:w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Right Half Line */}
                  <div className="flex-1">
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 w-full transition-colors ${getLineStyles(
                          index
                        )}`}
                      />
                    )}
                  </div>
                </div>

                {/* Label */}
                <span
                  className={`mt-2 text-center text-xs transition-colors sm:text-sm ${styles.text}`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
