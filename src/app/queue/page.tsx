"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type Story = {
  id: string;
  blobUrl: string;
  caption: string | null;
  scheduledAt: string;
  status: string;
};

const statusVariant = {
  pending: "accent",
  publishing: "warning",
  published: "success",
  failed: "error",
} as const;

export default function QueuePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    const res = await fetch("/api/queue");
    const data = await res.json();
    setStories(data);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/queue/${id}`, { method: "DELETE" });
    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) return <div className="p-8 text-text-secondary">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Scheduled Queue</h1>

      {stories.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No scheduled stories"
          subtitle="Schedule a story from the Publish page"
        >
          <Link href="/publish">
            <Button>Publish a Story</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {stories.map((story) => (
            <Card key={story.id} className="flex items-center gap-4">
              {/* Thumbnail */}
              <div
                className="h-14 w-14 flex-shrink-0 rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${story.blobUrl})` }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{story.caption || "Untitled"}</p>
                <p className="text-xs text-text-secondary">
                  Posting {formatDistanceToNow(new Date(story.scheduledAt), { addSuffix: true })}
                </p>
              </div>
              <Badge variant={statusVariant[story.status as keyof typeof statusVariant] ?? "neutral"}>
                {story.status}
              </Badge>
              {story.status === "pending" && (
                <button
                  onClick={() => handleDelete(story.id)}
                  className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
