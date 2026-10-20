import { EmptyData } from "@/components/empty-data";
import { ProfileBuilder } from "@/components/profile-builder";
import { PageHeader } from "@/components/ui";
import { hasData } from "@/lib/data";

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        step="Step 1 of 4"
        title="Who are you today?"
        description="Add your skills the way that suits you. SkillTide only uses your skills, study time, budget and the goals you pick — never your name, age, gender or background."
      />
      {hasData ? <ProfileBuilder /> : <EmptyData />}
    </>
  );
}
