"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminReviews, useRemoveReview } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Review } from "@/types/api";

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminReviews(page);
  const removeReview = useRemoveReview();
  const [removeTarget, setRemoveTarget] = useState<Review | null>(null);

  return (
    <>
      <Header title="Reviews" />
      <div className="flex-1 space-y-4 p-6">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Ratings (Food / Kitchen / Delivery)</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
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
                    No reviews yet.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {review.food_rating} / {review.kitchen_rating} / {review.delivery_rating}
                    </TableCell>
                    <TableCell className="max-w-sm truncate">{review.comment ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(review.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Remove reported review" onClick={() => setRemoveTarget(review)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
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
            <AlertDialogTitle>Remove this review?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.comment ? `"${removeTarget.comment}" — ` : ""}This is typically used to handle reported or
              inappropriate content. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removeTarget) return;
                removeReview.mutate(removeTarget.id, {
                  onSuccess: () => toast.success("Review removed"),
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
