import { TimelineEvent } from "@/types/article";
import Image from "next/image";

interface ProfileSectionProps {
  title: string;
  description: string;
  author: string;
  publishDate: string;
  imageUrl?: string | null;
  events: TimelineEvent[];
}

export function ProfileSection({
  title,
  description,
  author,
  publishDate,
  imageUrl,
  events,
}: ProfileSectionProps) {
  // Calculate stats
  const uniqueEntities = new Set(
    events.flatMap((event) => event.entities.map((e) => e.id))
  ).size;
  const uniqueTopics = new Set(events.map((event) => event.topic.main_topic))
    .size;

  return (
    <article className="p-6 h-full flex flex-col">
      {/* Header with category and date */}
      <div className="flex items-center gap-3 text-sm mb-4">
        <span className="bg-neutral-100 text-neutral-800 rounded-full px-3 py-1">
          Artificial Intelligence
        </span>
        <time className="text-neutral-600" dateTime={publishDate}>
          {new Date(publishDate).toLocaleDateString("en-US", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}
        </time>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-neutral-900 mb-4 leading-tight">
        {title}
      </h1>

      {/* Author */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-neutral-600">By {author}</span>
      </div>

      {/* Image Section */}
      <div className="relative w-full aspect-[4/3] mb-6 bg-neutral-100 rounded-lg overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-neutral-600 leading-relaxed mb-8">{description}</p>

      {/* Stats */}
      <div className="mt-auto border-t border-neutral-100 pt-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm font-medium text-neutral-500">Events</div>
            <div className="mt-1 text-xl font-semibold text-neutral-900">
              {events.length}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-500">Entities</div>
            <div className="mt-1 text-xl font-semibold text-neutral-900">
              {uniqueEntities}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-500">Topics</div>
            <div className="mt-1 text-xl font-semibold text-neutral-900">
              {uniqueTopics}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
