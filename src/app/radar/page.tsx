import { EmptyData } from "@/components/empty-data";
import { RadarView } from "@/components/radar-view";
import { PageHeader } from "@/components/ui";
import { hasData } from "@/lib/data";

export default function RadarPage() {
  return (
    <>
      <PageHeader
        step="Step 2 of 4"
        title="Future Skills Radar"
        description="Which skills and roles are rising or under pressure, estimated from dated AI-use and hiring signals. Move along the timeline to see how the picture changed as new data arrived, and switch the scenario to stress-test it."
      />
      {hasData ? <RadarView /> : <EmptyData />}
    </>
  );
}
