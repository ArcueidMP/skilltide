import { CareerCentreView } from "@/components/career-centre-view";
import { EmptyData } from "@/components/empty-data";
import { PageIntro } from "@/components/page-intro";
import { hasData } from "@/lib/data";
import { PAGE_INTROS } from "@/messages/pages";

export default function CareerCentrePage() {
  return (
    <>
      <PageIntro messages={PAGE_INTROS.careerCentre} />
      {hasData ? <CareerCentreView /> : <EmptyData />}
    </>
  );
}
