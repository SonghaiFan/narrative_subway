import { NavigationControls } from "@/components/navigation-controls";
import { NarrativeCurve } from "@/components/narrative-curve";
import { EntityDisplay } from "@/components/entity-display";
import { TopicAnalysis } from "@/components/topic-analysis";
import { ProfileSection } from "@/components/profile-section";
import { getTimelineData } from "@/lib/load-timeline-data";

export default async function Home() {
  const { metadata, events } = await getTimelineData("data.json");

  return (
    <div className="h-screen w-screen grid grid-cols-[30%_70%] grid-rows-[30%_70%] bg-gray-50">
      <div className="bg-white border border-gray-200 shadow-sm">
        <ProfileSection
          title={metadata.title}
          description={metadata.description}
          author={metadata.author}
          publishDate={metadata.publishDate}
          imageUrl={metadata.imageUrl}
          events={events}
        />
      </div>

      {/* Topic Analysis Section */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="h-full overflow-auto">
          <TopicAnalysis events={events} />
        </div>
      </div>

      {/* Entity Analysis Section */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="h-full overflow-auto">
          <EntityDisplay events={events} />
        </div>
      </div>

      {/* Narrative Curve */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="h-full overflow-auto">
          <NarrativeCurve events={events} selectedEventId={undefined} />
        </div>
      </div>
    </div>
  );
}
