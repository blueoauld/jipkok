"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = React.ComponentProps<typeof Button> & {
  pending: boolean;
};

export function PendingButton({
  pending,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <Button disabled={pending || disabled} {...props}>
      {pending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}
