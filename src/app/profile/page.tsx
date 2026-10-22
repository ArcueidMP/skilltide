import { EmptyData } from "@/components/empty-data";
import { ProfileBuilder } from "@/components/profile-builder";
import { PageIntro } from "@/components/page-intro";
import { hasData } from "@/lib/data";
import { PAGE_INTROS } from "@/messages/pages";

export default function ProfilePage() {
  return (
    <>
      <PageIntro messages={PAGE_INTROS.profile} />
      {hasData ? <ProfileBuilder /> : <EmptyData />}
    </>
  );
}
