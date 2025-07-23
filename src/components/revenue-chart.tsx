
'use client';

import * as React from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartData } from '@/app/(app)/dashboard/dashboard-client';
import { formatCurrency } from '@/lib/utils';

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
};

export default function RevenueChart({ data }: { data: ChartData[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the last 7 months.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart data={data} accessibilityLayer>
                        <XAxis
                            dataKey="month"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip 
                            cursor={{fill: 'hsl(var(--accent))', radius: 4}} 
                            content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
