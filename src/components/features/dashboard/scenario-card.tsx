"use client";
import Image from "next/image";

export interface ScenarioCardProps {
  title: string;
  description: string;
  imageSrc: string;
  onClick: () => void;
  isSelected: boolean;
}

export function ScenarioCard({
  title,
  description,
  imageSrc,
  onClick,
  isSelected,
}: ScenarioCardProps) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg border transition-all cursor-pointer bg-white hover:shadow-md h-[200px] ${
        isSelected
          ? "border-blue-500 ring-1 ring-blue-500 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <div className="p-3 flex flex-col h-full">
        <div className="bg-gray-100 rounded-md overflow-hidden mb-2.5 h-24 flex-shrink-0">
          <Image
            src={imageSrc}
            alt={title}
            width={400}
            height={200}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-1">
          {title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 leading-snug flex-grow">
          {description}
        </p>
        {isSelected && (
          <div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
              Selected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
