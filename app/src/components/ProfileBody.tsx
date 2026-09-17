import { useTranslation } from "react-i18next";

import { ProfileSection } from "@/components/ProfileSection";
import {
  bioCopiedMessage,
  commentCopiedMessage,
  profileBioEmptyMessage,
  profileCommentEmptyMessage,
} from "@/lib/message";

// 회원 프로필과 내 프로필이 같이 쓰는 코멘트와 소개 묶음이다.
export function ProfileBody({
  comment,
  bio,
}: {
  comment?: string | null;
  bio?: string | null;
}) {
  const { t } = useTranslation();

  return (
    <>
      <ProfileSection
        title={t("profile.comment")}
        body={comment}
        placeholder={profileCommentEmptyMessage()}
        copiedMessage={commentCopiedMessage()}
      />

      <ProfileSection
        title={t("profile.bio")}
        body={bio}
        placeholder={profileBioEmptyMessage()}
        copiedMessage={bioCopiedMessage()}
      />
    </>
  );
}
