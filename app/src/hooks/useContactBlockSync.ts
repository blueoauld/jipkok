import { useQueryClient } from "@tanstack/react-query";
import { useSegments } from "expo-router";
import { useEffect } from "react";

import { CONTACT_BLOCK_COUNT_KEY } from "@/hooks/useContactBlockToggle";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth/store";
import {
  hasContactsPermission,
  readContactNumbers,
} from "@/lib/contact-block/contacts";
import { reportError } from "@/lib/crash";

// 켜 둔 회원은 앱을 열 때마다 주소록을 다시 올려 새로 저장한 번호도 걸리게 한다.
async function syncContactBlocks() {
  if (
    (await api.contactBlocks.count()) === 0 ||
    !(await hasContactsPermission())
  ) {
    return null;
  }

  const numbers = await readContactNumbers();
  await api.contactBlocks.replace(numbers);

  return numbers.length;
}

export function useContactBlockSync() {
  const status = useAuthStore((state) => state.status);
  const [group] = useSegments();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (group !== "(app)" || status !== "authenticated") {
      return;
    }

    syncContactBlocks()
      .then((count) => {
        if (count !== null) {
          queryClient.setQueryData(CONTACT_BLOCK_COUNT_KEY, count);
        }
      })
      .catch((error) => reportError("contact-block-sync", error));
  }, [group, queryClient, status]);
}
