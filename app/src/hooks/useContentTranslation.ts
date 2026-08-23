import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { apiErrorMessage } from "@/lib/alert";
import { api, type TranslationSource } from "@/lib/api";
import { showToast } from "@/lib/toast/store";

// 번역은 한 번 받아두면 바뀌지 않아 화면이 살아 있는 동안 다시 부르지 않는다.
export function useContentTranslation(
  sourceType: TranslationSource,
  sourceId: number,
) {
  const [translated, setTranslated] = useState<string>();
  const [showing, setShowing] = useState(false);

  const translate = useMutation({
    mutationFn: () => api.translations.translate(sourceType, sourceId),
    onSuccess: ({ content }) => {
      setTranslated(content);
      setShowing(true);
    },
    onError: (error) => showToast("error", apiErrorMessage(error)),
  });

  const toggle = () => {
    if (translated) {
      setShowing((current) => !current);
      return;
    }

    translate.mutate();
  };

  return {
    showing,
    pending: translate.isPending,
    toggle,
    contentOf: (original: string | null | undefined) =>
      showing && translated ? translated : (original ?? ""),
  };
}
