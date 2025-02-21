import { getTimelineData } from "@/lib/load-timeline-data";
import { ResizableLayout } from "@/components/layout/resizable-layout";

export default async function Home() {
  const { metadata, events } = await getTimelineData("data.json");
  return <ResizableLayout metadata={metadata} events={events} />;
}
