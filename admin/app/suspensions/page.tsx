import { PageHeader } from "@/components/page-header";
import { SuspensionList } from "@/components/suspensions/suspension-list";
import { suspensions } from "@/lib/mock/suspensions";

export default function SuspensionsPage() {
  return (
    <>
      <PageHeader
        title="정지"
        description="정지 중인 회원과 정지 이력을 관리합니다."
      />
      <SuspensionList suspensions={suspensions} />
    </>
  );
}
