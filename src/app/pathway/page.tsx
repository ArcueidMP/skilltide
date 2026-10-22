import { EmptyData } from "@/components/empty-data";
import { PathwayView } from "@/components/pathway-view";
import { PageIntro } from "@/components/page-intro";
import { hasData } from "@/lib/data";
import { PAGE_INTROS } from "@/messages/pages";

export default function PathwayPage() {
  return (
    <>
      <PageIntro messages={PAGE_INTROS.pathway} />
      {hasData ? <PathwayView /> : <EmptyData />}
    </>
  );
}
