"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface IntroductionPageProps {
  onComplete: () => void;
}

export function IntroductionPage({ onComplete }: IntroductionPageProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to the Study",
      content:
        "Thank you for participating in our user study. This study aims to understand how different visualization approaches help users comprehend narrative data. Please complete this introduction to begin the study.",
    },
    {
      title: "Study Overview",
      content: "In this study, you will:",
      details: [
        "Read and analyze narrative content",
        "Complete specific tasks to demonstrate your understanding",
        "Interact with the interface at your own pace",
        "Provide feedback on your experience",
      ],
    },
    {
      title: "Interface Overview",
      content:
        "You will be presented with a narrative interface that includes:",
      details: [
        "Text Panel: Shows the narrative content in a traditional text format",
        "Task Panel: Guides you through specific tasks to complete",
        "Navigation Controls: Helps you move through the content",
      ],
    },
    {
      title: "Task Panel",
      content:
        "On the right side, you will find a task panel that will guide you through specific tasks to complete. Each task will help us understand how well you comprehend the narrative.",
    },
    {
      title: "Getting Started",
      content:
        "When you're ready, click the button below to begin the study. Take your time to explore the interface and complete the tasks at your own pace. You cannot return to this introduction once you begin.",
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
    <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-sm font-medium text-blue-600 mb-2">
              Step {currentStep + 1} of {steps.length}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
          </div>
          <p className="text-gray-600 mb-4">{steps[currentStep].content}</p>
          {steps[currentStep].details && (
            <ul className="text-left space-y-2 mb-6">
              {steps[currentStep].details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-600">{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === currentStep ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
          >
            {currentStep === steps.length - 1 ? "Begin Study" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
