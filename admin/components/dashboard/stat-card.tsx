import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCount } from "@/lib/format";

type Props = {
  title: string;
  value: number;
  href?: string;
};

export function StatCard({ title, value, href }: Props) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {href ? (
            <Link href={href} className="hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-semibold tabular-nums">
        {formatCount(value)}
      </CardContent>
    </Card>
  );
}
