"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCount } from "@/lib/format";
import type { Demographics } from "@/lib/types";

const config = {
  male: { label: "남자", color: "var(--chart-1)" },
  female: { label: "여자", color: "var(--chart-2)" },
} satisfies ChartConfig;

type Props = {
  data: Demographics;
};

export function DemographicsChart({ data }: Props) {
  const total = data.male + data.female;
  const malePercent = total === 0 ? 0 : Math.round((data.male / total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>회원 구성</CardTitle>
        <CardDescription>
          남자 {formatCount(data.male)}명 ({malePercent}%), 여자{" "}
          {formatCount(data.female)}명 ({100 - malePercent}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64 w-full">
          <BarChart
            data={data.ageGroups}
            margin={{ left: 0, right: 12, top: 8 }}
            barGap={2}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="male" fill="var(--color-male)" />
            <Bar dataKey="female" fill="var(--color-female)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
