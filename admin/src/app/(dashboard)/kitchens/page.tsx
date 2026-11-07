"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import {
  useApproveKitchen,
  useAdminKitchens,
  useRejectKitchen,
  useSuspendKitchen,
  useUnsuspendKitchen,
  useVerifyKitchen,
} from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/lib/api";
import type { Kitchen } from "@/types/api";

const STATUS_TABS = ["pending", "approved", "rejected", "suspended"] as const;

export default function KitchensPage() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>("pending");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminKitchens(page, status);
  const approve = useApproveKitchen();
  const reject = useRejectKitchen();
  const verify = useVerifyKitchen();
  const suspend = useSuspendKitchen();
  const unsuspend = useUnsuspendKitchen();

  const [rejectTarget, setRejectTarget] = useState<Kitchen | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<Kitchen | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  return (
    <>
      <Header title="Kitchens" />
      <div className="flex-1 space-y-4 p-6">
        <Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v as typeof status);
            setPage(1);
          }}
        >
          <TabsList>
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kitchen</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Verified</TableHead>
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
                    No {status} kitchens.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((kitchen) => (
                  <TableRow key={kitchen.id}>
                    <TableCell className="font-medium">{kitchen.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{kitchen.address}</TableCell>
                    <TableCell>{kitchen.rating > 0 ? kitchen.rating.toFixed(1) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={kitchen.verified ? "default" : "secondary"}>{kitchen.verified ? "Verified" : "Unverified"}</Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      {kitchen.status === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              approve.mutate(kitchen.id, {
                                onSuccess: () => toast.success(`${kitchen.name} approved`),
                                onError: (e) => toast.error(getApiErrorMessage(e)),
                              })
                            }
                          >
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setRejectReason(""); setRejectTarget(kitchen); }}>
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {kitchen.status === "rejected" ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            approve.mutate(kitchen.id, {
                              onSuccess: () => toast.success(`${kitchen.name} approved`),
                              onError: (e) => toast.error(getApiErrorMessage(e)),
                            })
                          }
                        >
                          Approve Anyway
                        </Button>
                      ) : null}
                      {kitchen.status === "approved" && !kitchen.verified ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            verify.mutate(kitchen.id, {
                              onSuccess: () => toast.success(`${kitchen.name} verified`),
                              onError: (e) => toast.error(getApiErrorMessage(e)),
                            })
                          }
                        >
                          Verify
                        </Button>
                      ) : null}
                      {kitchen.status === "approved" ? (
                        <Button variant="outline" size="sm" onClick={() => { setSuspendReason(""); setSuspendTarget(kitchen); }}>
                          Suspend
                        </Button>
                      ) : null}
                      {kitchen.status === "suspended" ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            unsuspend.mutate(kitchen.id, {
                              onSuccess: () => toast.success(`${kitchen.name} reinstated`),
                              onError: (e) => toast.error(getApiErrorMessage(e)),
                            })
                          }
                        >
                          Reinstate
                        </Button>
                      ) : null}
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

      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {rejectTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>The kitchen owner will be notified with the reason below.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Business license documents were unclear or missing."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={rejectReason.trim().length < 3}
              onClick={() => {
                if (!rejectTarget) return;
                reject.mutate(
                  { id: rejectTarget.id, reason: rejectReason.trim() },
                  {
                    onSuccess: () => toast.success("Kitchen rejected"),
                    onError: (e) => toast.error(getApiErrorMessage(e)),
                  }
                );
                setRejectTarget(null);
              }}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!suspendTarget} onOpenChange={(open) => !open && setSuspendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {suspendTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The kitchen will be hidden from customers and closed for new orders immediately. You can reinstate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="suspend-reason">Reason (optional)</Label>
            <Textarea
              id="suspend-reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Repeated hygiene complaints from customers."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!suspendTarget) return;
                suspend.mutate(
                  { id: suspendTarget.id, reason: suspendReason.trim() || undefined },
                  {
                    onSuccess: () => toast.success(`${suspendTarget.name} suspended`),
                    onError: (e) => toast.error(getApiErrorMessage(e)),
                  }
                );
                setSuspendTarget(null);
              }}
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
