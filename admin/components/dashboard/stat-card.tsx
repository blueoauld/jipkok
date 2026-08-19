import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCount } from "@/lib/format";

type Props = {
  title: string;
  value: number;
  href: string;
};

export function StatCard({ title, value, href }: Props) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          <Link href={href} className="hover:underline">
            {title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 text-3xl font-semibold tabular-nums">
        {formatCount(value)}
      </CardContent>
    </Card>
  );
}
