import { type ReactNode, useContext } from "react";
import { XStack } from "tamagui";

import { Glass } from "@/components/ui/Glass";
import { GLASS_ENABLED, GlassGroupContext } from "@/lib/glass";

export function GlassSurface({
  size,
  children,
}: {
  size: number;
  children: ReactNode;
}) {
  const grouped = useContext(GlassGroupContext);

  if (!GLASS_ENABLED) {
    return <>{children}</>;
  }

  // 묶인 자리에서는 바깥 유리 하나가 캡슐을 그린다. 여기서 또 깔면 두 겹이 된다.
  if (grouped) {
    return (
      <XStack width={size} height={size} items="center" justify="center">
        {children}
      </XStack>
    );
  }

  return (
    <Glass
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
      isInteractive
    >
      {children}
    </Glass>
  );
}
