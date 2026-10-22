import { MethodologyView } from "@/components/methodology-view";
import { PageIntro } from "@/components/page-intro";
import { hasData } from "@/lib/data";
import { PAGE_INTROS } from "@/messages/pages";

export default function MethodologyPage() {
  return (
    <>
      <PageIntro messages={PAGE_INTROS.methodology} />
      {hasData ? <MethodologyView /> : null}
    </>
  );
}
