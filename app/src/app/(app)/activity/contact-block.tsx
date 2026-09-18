import * as Haptics from "expo-haptics";
import { Stack } from "expo-router";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HeaderIconButton } from "@/components/HeaderIconButton";
import { PhoneInputDialog } from "@/components/PhoneInputDialog";
import { Button } from "@/components/ui/Button";
import { ListEmpty } from "@/components/ui/ListEmpty";
import { ListRow, ListRowTopSpacer } from "@/components/ui/ListRow";
import { ScreenState } from "@/components/ui/ScreenState";
import { Text } from "@/components/ui/Text";
import { useAlert } from "@/hooks/useAlert";
import {
  useAddContactBlock,
  useContactBlocks,
  useRemoveContactBlock,
} from "@/hooks/useContactBlocks";
import type { ContactBlockResponse } from "@/lib/api";
import { LIST_ROW_EVEN_PADDING_Y } from "@/lib/design";
import { listErrorMessage } from "@/lib/message";
import { toDomestic } from "@/lib/phone";

// 마지막 행 아래도 행 사이처럼 좌우 여백만큼 비도록 행 위아래 여백 하나를 더한다.
const LIST_STYLE = { paddingBottom: LIST_ROW_EVEN_PADDING_Y };

function ContactBlockRow({
  block,
  onRemove,
}: {
  block: ContactBlockResponse;
  onRemove: (contactBlockId: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <ListRow
      horizontalPadding="small"
      verticalPadding={LIST_ROW_EVEN_PADDING_Y}
      right={
        <Button
          size="small"
          variant="secondary"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRemove(block.contactBlockId);
          }}
        >
          {t("action.delete")}
        </Button>
      }
    >
      <Text preset="label" color="$grey800">
        {toDomestic(block.phoneNumber)}
      </Text>

      {block.memo && (
        <Text preset="sub" numberOfLines={1} color="$grey600">
          {block.memo}
        </Text>
      )}
    </ListRow>
  );
}

// 안내 문구도 행과 같은 여백의 행으로 두고, 맨 위 빈칸으로 헤더 아래 공간을 행 사이 공간과 맞춘다.
function Notice() {
  const { t } = useTranslation();

  return (
    <>
      <ListRowTopSpacer verticalPadding={LIST_ROW_EVEN_PADDING_Y} />
      <ListRow
        horizontalPadding="small"
        verticalPadding={LIST_ROW_EVEN_PADDING_Y}
      >
        <Text preset="sub" color="$grey600">
          {t("contactBlock.notice")}
        </Text>
      </ListRow>
    </>
  );
}

export default function ContactBlockScreen() {
  const { t } = useTranslation();
  const { alertElement, show, showApiError } = useAlert();
  const [addOpen, setAddOpen] = useState(false);
  const { data: blocks, error, refetch } = useContactBlocks();
  const add = useAddContactBlock(showApiError);
  const remove = useRemoveContactBlock(showApiError);

  const openAdd = useCallback(() => setAddOpen(true), []);
  const screenOptions = useMemo(
    () => ({
      title: t("list.contactBlocks"),
      headerRight: () => (
        <HeaderIconButton
          icon={PlusIcon}
          label={t("contactBlock.addTitle")}
          weight="bold"
          onPress={openAdd}
        />
      ),
    }),
    [openAdd, t],
  );

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
          ListHeaderComponent={Notice}
          contentContainerStyle={LIST_STYLE}
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
