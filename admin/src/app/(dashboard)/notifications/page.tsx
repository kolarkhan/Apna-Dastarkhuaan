"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBroadcastNotification } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/lib/api";

export default function NotificationsPage() {
  const broadcast = useBroadcastNotification();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "customers" | "kitchen_owners">("all");

  const onSend = () => {
    if (title.trim().length < 2 || body.trim().length < 2) {
      toast.error("Please fill in both the title and message.");
      return;
    }
    broadcast.mutate(
      { title: title.trim(), body: body.trim(), audience },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          setTitle("");
          setBody("");
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      }
    );
  };

  return (
    <>
      <Header title="Notifications" />
      <div className="flex-1 p-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Broadcast Announcement</CardTitle>
            <CardDescription>Send an in-app notification to customers, kitchen owners, or everyone.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="customers">Customers only</SelectItem>
                  <SelectItem value="kitchen_owners">Kitchen owners only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend Special!" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Write your announcement..." />
            </div>
            <Button onClick={onSend} disabled={broadcast.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
