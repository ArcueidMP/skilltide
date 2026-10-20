import { CareerCentreView } from "@/components/career-centre-view";
import { EmptyData } from "@/components/empty-data";
import { PageHeader } from "@/components/ui";
import { hasData } from "@/lib/data";

export default function CareerCentrePage() {
  return (
    <>
      <PageHeader
        step="For university career centres"
        title="Cohort view"
        description="The same engine, run across a whole year group: where skills are thin on the ground, which roles students are heading for, and what that means for the SDGs."
      />
      {hasData ? <CareerCentreView /> : <EmptyData />}
    </>
  );
}
