import { EmptyData } from "@/components/empty-data";
import { PathwayView } from "@/components/pathway-view";
import { PageHeader } from "@/components/ui";
import { hasData } from "@/lib/data";

export default function PathwayPage() {
  return (
    <>
      <PageHeader
        step="Step 4 of 4"
        title="Your reskilling pathway"
        description="An ordered plan that closes your most important gaps first, using free or low-cost courses that exist today. Every duration and price links to where we read it."
      />
      {hasData ? <PathwayView /> : <EmptyData />}
    </>
  );
}
