"use client";

import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminPayments } from "@/hooks/useAdmin";
import { formatDateTime, formatPKR } from "@/lib/format";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  pending: "outline",
  failed: "destructive",
  refunded: "secondary",
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminPayments(page);

  return (
    <>
      <Header title="Payments" />
      <div className="flex-1 space-y-4 p-6">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No payments yet.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((payment) => (
                  <TableRow key={payment.order_id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{payment.order_id}</TableCell>
                    <TableCell className="uppercase">{payment.method}</TableCell>
                    <TableCell>{formatPKR(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[payment.status] ?? "outline"} className="capitalize">
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(payment.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {data ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {data.page} · {data.total} total</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={!data.has_more} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
