"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminFoods, useRemoveFood } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/lib/api";
import { formatPKR } from "@/lib/format";
import type { FoodItem } from "@/types/api";

export default function FoodsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminFoods(page);
  const removeFood = useRemoveFood();
  const [removeTarget, setRemoveTarget] = useState<FoodItem | null>(null);

  return (
    <>
      <Header title="Food Listings" />
      <div className="flex-1 space-y-4 p-6">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No food listings yet.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((food) => (
                  <TableRow key={food.id}>
                    <TableCell className="font-medium">{food.name}</TableCell>
                    <TableCell>{formatPKR(food.price)}</TableCell>
                    <TableCell>{food.rating > 0 ? food.rating.toFixed(1) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={food.available ? "secondary" : "outline"}>{food.available ? "Available" : "Unavailable"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setRemoveTarget(food)}>
                        Remove
                      </Button>
                    </TableCell>
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

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove &quot;{removeTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This listing will be permanently removed from the kitchen&apos;s menu. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removeTarget) return;
                removeFood.mutate(removeTarget.id, {
                  onSuccess: () => toast.success("Listing removed"),
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                });
                setRemoveTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
