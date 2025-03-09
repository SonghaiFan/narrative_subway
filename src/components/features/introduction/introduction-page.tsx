"use client";

import { useState } from "react";

// Define scenario types
export type ScenarioType = "text" | "visual" | "text-chat" | "visual-chat";

// Define introduction content for each scenario type
const introductionContent = {
  text: [
    {
      title: "Welcome to the Text-Based Study",
      content:
        "Thank you for participating in our user study. This study aims to understand how text-based approaches help users comprehend narrative data.",
    },
    {
      title: "Text Interface Overview",
      content:
        "In this study, you will read and analyze narrative content in a text-only format, complete specific tasks, and interact with the interface at your own pace.",
    },
    {
      title: "Text Features",
      content:
        "You will be presented with a narrative interface that includes text content, a task panel, and navigation controls. The interface focuses on clear textual presentation.",
    },
    {
      title: "Getting Started",
      content:
        "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
    },
  ],
  visual: [
    {
      title: "Welcome to the Visualization Study",
      content:
        "Thank you for participating in our user study. This study aims to understand how visual approaches help users comprehend narrative data.",
    },
    {
      title: "Visualization Interface Overview",
      content:
        "In this study, you will explore narrative content through visualizations, complete specific tasks, and interact with the interface at your own pace.",
    },
    {
      title: "Visual Features",
      content:
        "You will be presented with a narrative interface that includes visual representations, interactive elements, a task panel, and navigation controls.",
    },
    {
      title: "Getting Started",
      content:
        "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
    },
  ],
  "text-chat": [
    {
      title: "Welcome to the Text-Chat Study",
      content:
        "Thank you for participating in our user study. This study aims to understand how text-based chat interfaces help users comprehend narrative data.",
    },
    {
      title: "Text-Chat Interface Overview",
      content:
        "In this study, you will interact with narrative content through a chat interface, complete specific tasks, and engage with the system at your own pace.",
    },
    {
      title: "Chat Features",
      content:
        "You will be presented with a chat interface that allows you to ask questions and receive responses about the narrative content, alongside a task panel and navigation controls.",
    },
    {
      title: "Getting Started",
      content:
        "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
    },
  ],
  "visual-chat": [
    {
      title: "Welcome to the Visual-Chat Study",
      content:
        "Thank you for participating in our user study. This study aims to understand how visual representations with chat capabilities help users comprehend narrative data.",
    },
    {
      title: "Visual-Chat Interface Overview",
      content:
        "In this study, you will explore narrative content through visualizations and a chat interface, complete specific tasks, and interact at your own pace.",
    },
    {
      title: "Combined Features",
      content:
        "You will be presented with an interface that combines visual representations with chat capabilities, allowing you to both see and ask about narrative elements.",
    },
    {
      title: "Getting Started",
      content:
        "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
    },
  ],
};

// Default generic content as fallback
const defaultSteps = [
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
      "You will be presented with a narrative interface that includes content, a task panel, and navigation controls.",
  },
  {
    title: "Getting Started",
    content:
      "When you're ready, click the button below to begin. You cannot return to this introduction once you begin.",
  },
];

interface IntroductionPageProps {
  onComplete: () => void;
  scenarioType?: ScenarioType;
}

export function IntroductionPage({
  onComplete,
  scenarioType = "text",
}: IntroductionPageProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Get the appropriate steps based on scenario type
  const steps =
    scenarioType && introductionContent[scenarioType]
      ? introductionContent[scenarioType]
      : defaultSteps;

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
