import { EmptyData } from "@/components/empty-data";
import { MatchView } from "@/components/match-view";
import { PageHeader } from "@/components/ui";
import { hasData } from "@/lib/data";

export default function MatchPage() {
  return (
    <>
      <PageHeader
        step="Step 3 of 4"
        title="Your best-fit future roles"
        description="Every score is a visible formula: what you already have, how the role is likely to change with AI, and how it serves the goals you care about. Switch the scenario at the top and watch the ranking move."
      />
      {hasData ? <MatchView /> : <EmptyData />}
    </>
  );
}
