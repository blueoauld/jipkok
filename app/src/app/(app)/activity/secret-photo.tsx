import { Stack } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityList } from "@/components/activity/ActivityList";
import {
  relationListKey,
  useMemberList,
  useRemoveFromMemberList,
} from "@/hooks/useMemberList";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import { api } from "@/lib/api";

const GRANTED_SECRET_PHOTOS_KEY = relationListKey("secretPhotos", "granted");

export default function SecretPhotoListScreen() {
  const { t } = useTranslation();
  const screenOptions = useMemo(() => ({ title: t("list.secretPhotos") }), [t]);

  const query = useMemberList(
    GRANTED_SECRET_PHOTOS_KEY,
    api.secretPhotos.granted,
  );
  const { alertElement, showApiError } = useRetroAlert();
  const remove = useRemoveFromMemberList(
    GRANTED_SECRET_PHOTOS_KEY,
    api.secretPhotos.remove,
    showApiError,
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      <ActivityList query={query} onDelete={remove.mutate} />

      {alertElement}
    </SafeAreaView>
  );
}
