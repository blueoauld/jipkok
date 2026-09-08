import { Stack } from "expo-router";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTokens, Text, XStack, YStack } from "tamagui";

import { HeaderSoloIconButton } from "@/components/HeaderSoloIconButton";
import { PhoneInputDialog } from "@/components/PhoneInputDialog";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { RetroCard } from "@/components/ui/RetroCard";
import { RetroDeleteButton } from "@/components/ui/RetroDeleteButton";
import { ScreenState } from "@/components/ui/ScreenState";
import {
  useAddContactBlock,
  useContactBlocks,
  useRemoveContactBlock,
} from "@/hooks/useContactBlocks";
import { useRetroAlert } from "@/hooks/useRetroAlert";
import type { ContactBlockResponse } from "@/lib/api";
import { listErrorMessage } from "@/lib/message";
import { toDomestic } from "@/lib/phone";

function ContactBlockRow({
  block,
  onRemove,
}: {
  block: ContactBlockResponse;
  onRemove: (contactBlockId: number) => void;
}) {
  return (
    <RetroCard>
      <XStack items="center" justify="space-between" gap="$3">
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600">
            {toDomestic(block.phoneNumber)}
          </Text>
          {block.memo && (
            <Text theme="gray" color="$color11" fontSize="$2" numberOfLines={1}>
              {block.memo}
            </Text>
          )}
        </YStack>
        <RetroDeleteButton onPress={() => onRemove(block.contactBlockId)} />
      </XStack>
    </RetroCard>
  );
}

export default function ContactBlockScreen() {
  const { t } = useTranslation();
  const { alertElement, show, showApiError } = useRetroAlert();
  const [addOpen, setAddOpen] = useState(false);
  const { data: blocks, error, refetch } = useContactBlocks();
  const add = useAddContactBlock(showApiError);
  const remove = useRemoveContactBlock(showApiError);

  const openAdd = useCallback(() => setAddOpen(true), []);
  const screenOptions = useMemo(
    () => ({
      title: t("list.contactBlocks"),
      headerRight: () => (
        <HeaderSoloIconButton
          icon={PlusIcon}
          label={t("contactBlock.addTitle")}
          weight="bold"
          onPress={openAdd}
        />
      ),
    }),
    [openAdd, t],
  );
  const contentStyle = useMemo(() => {
    const space = getTokens().space;

    return {
      padding: space.$4.val,
      gap: space.$4.val,
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen options={screenOptions} />

      {blocks ? (
        <FlatList
          data={blocks}
          keyExtractor={(block) => String(block.contactBlockId)}
          renderItem={({ item }) => (
            <ContactBlockRow block={item} onRemove={remove.mutate} />
          )}
          contentContainerStyle={contentStyle}
          ListHeaderComponent={
            <Text theme="gray" color="$color11" fontSize="$2">
              {t("contactBlock.notice")}
            </Text>
          }
          ListEmptyComponent={<ListEmpty>{t("contactBlock.empty")}</ListEmpty>}
        />
      ) : (
        <ScreenState
          error={error}
          message={listErrorMessage()}
          onRetry={() => refetch()}
        />
      )}

      <PhoneInputDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title={t("contactBlock.addTitle")}
        submitLabel={t("contactBlock.submit")}
        onSubmit={(phoneNumber, memo) => add.mutate({ phoneNumber, memo })}
        onInvalid={() => show("warning", t("contactBlock.invalid"))}
      />

      {alertElement}
    </SafeAreaView>
  );
}
