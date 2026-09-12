import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type ContactBlockResponse } from "@/lib/api";
import i18n from "@/lib/i18n";
import { showToast } from "@/lib/toast/store";

const CONTACT_BLOCKS_KEY = ["contact-blocks"];

const ADDED_MESSAGE = i18n.t("contactBlock.added");
const REMOVED_MESSAGE = i18n.t("contactBlock.removed");

export function useContactBlocks() {
  return useQuery({
    queryKey: CONTACT_BLOCKS_KEY,
    queryFn: api.contactBlocks.list,
  });
}

export function useAddContactBlock(onError: (error: unknown) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.contactBlocks.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_BLOCKS_KEY });
      showToast("info", ADDED_MESSAGE);
    },
    onError,
  });
}

export function useRemoveContactBlock(onError: (error: unknown) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.contactBlocks.remove,
    onMutate: async (contactBlockId: number) => {
      await queryClient.cancelQueries({ queryKey: CONTACT_BLOCKS_KEY });

      queryClient.setQueryData<ContactBlockResponse[]>(
        CONTACT_BLOCKS_KEY,
        (current) =>
          current?.filter((item) => item.contactBlockId !== contactBlockId),
      );
    },
    onSuccess: () => showToast("info", REMOVED_MESSAGE),
    // 목록 전체를 스냅샷으로 되돌리면 그 사이 성공한 다른 삭제까지 되살아난다.
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: CONTACT_BLOCKS_KEY });
      onError(error);
    },
  });
}
