"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function GstSummaryChart({
    data
}: {
    data: { name: string; liability: number; itc: number; payable: number }[]
}) {
    return (
        <div className="h-[300px] w-full text-xs">
            {data.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg">
                    <p>No GST data available to chart.</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            stroke="hsl(var(--muted-foreground))"
                            tickFormatter={(value) => `₹${value.toLocaleString()}`}
                        />
                        <Tooltip
                            formatter={(value: any) => `₹${Number(value).toLocaleString()}`}
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "8px"
                            }}
                            itemStyle={{ fontWeight: 500 }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        <Bar dataKey="liability" name="Tax Liability" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="itc" name="ITC Available" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="payable" name="Net Payable" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
