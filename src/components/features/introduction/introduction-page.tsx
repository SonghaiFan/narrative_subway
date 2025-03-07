"use client";

import { useState } from "react";

interface IntroductionPageProps {
  onComplete: () => void;
}

export function IntroductionPage({ onComplete }: IntroductionPageProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to the Study",
      content:
        "Thank you for participating in our user study. This study aims to understand how different approaches help users comprehend narrative data.",
    },
    {
      title: "Study Overview",
      content:
        "In this study, you will read and analyze narrative content, complete specific tasks, and interact with the interface at your own pace.",
    },
    {
      title: "Interface Overview",
      content:
        "You will be presented with a narrative interface that includes text content, a task panel, and navigation controls.",
    },
    {
      title: "Getting Started",
      content:
        "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full mx-auto">
        <div className="text-sm font-medium text-blue-600 mb-1">
          Step {currentStep + 1} of {steps.length}
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          {steps[currentStep].title}
        </h2>

        <p className="text-gray-600 mb-6 text-sm">
          {steps[currentStep].content}
        </p>

        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {currentStep === steps.length - 1 ? "Begin" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
