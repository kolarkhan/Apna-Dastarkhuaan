"use client";

import {
  BadgeCheck,
  Clock3,
  Hourglass,
  Package,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useAdmin";
import { formatPKR } from "@/lib/format";

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  const chartData = stats
    ? [
        { name: "Platform Revenue", value: stats.platform_revenue },
        { name: "Gross Order Value", value: stats.gross_merchandise_value },
      ]
    : [];

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={UsersRound} label="Total Customers" value={String(stats?.total_customers ?? 0)} loading={isLoading} tone="primary" />
          <StatCard icon={UtensilsCrossed} label="Total Kitchens" value={String(stats?.total_kitchens ?? 0)} loading={isLoading} />
          <StatCard icon={BadgeCheck} label="Verified Kitchens" value={String(stats?.verified_kitchens ?? 0)} loading={isLoading} tone="success" />
          <StatCard icon={Hourglass} label="Pending Approvals" value={String(stats?.pending_kitchen_approvals ?? 0)} loading={isLoading} tone="warning" />
          <StatCard icon={ReceiptText} label="Total Orders" value={String(stats?.total_orders ?? 0)} loading={isLoading} />
          <StatCard icon={Clock3} label="Today's Orders" value={String(stats?.today_orders ?? 0)} loading={isLoading} tone="primary" />
          <StatCard icon={Package} label="Active Orders" value={String(stats?.active_orders ?? 0)} loading={isLoading} tone="success" />
          <StatCard icon={Wallet} label="Platform Revenue" value={formatPKR(stats?.platform_revenue ?? 0)} loading={isLoading} tone="warning" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatPKR(Number(v))} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
