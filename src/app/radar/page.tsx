import { EmptyData } from "@/components/empty-data";
import { RadarView } from "@/components/radar-view";
import { PageIntro } from "@/components/page-intro";
import { hasData } from "@/lib/data";
import { PAGE_INTROS } from "@/messages/pages";

export default function RadarPage() {
  return (
    <>
      <PageIntro messages={PAGE_INTROS.radar} />
      {hasData ? <RadarView /> : <EmptyData />}
    </>
  );
}
