import { EmptyData } from "@/components/empty-data";
import { MatchView } from "@/components/match-view";
import { PageIntro } from "@/components/page-intro";
import { hasData } from "@/lib/data";
import { PAGE_INTROS } from "@/messages/pages";

export default function MatchPage() {
  return (
    <>
      <PageIntro messages={PAGE_INTROS.match} />
      {hasData ? <MatchView /> : <EmptyData />}
    </>
  );
}
