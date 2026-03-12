"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AtSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Mention = {
  id: string;
  media_url: string;
  username: string;
  timestamp: string;
  caption?: string;
  action?: string;
};

type Filter = "all" | "pending" | "reposted" | "skipped";

export default function MentionsPage() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMentions = useCallback(async () => {
    const res = await fetch("/api/instagram/mentions");
    const data = await res.json();
    setMentions(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMentions();
  }, [fetchMentions]);

  async function handleAction(id: string, action: "repost" | "skip") {
    setActionLoading(id);
    try {
      await fetch(`/api/instagram/mentions/${id}/${action}`, { method: "POST" });
      setMentions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, action: action === "repost" ? "reposted" : "skipped" } : m))
      );
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = mentions.filter((m) => {
    if (filter === "all") return true;
    if (filter === "pending") return !m.action;
    return m.action === filter;
  });

  const filters: Filter[] = ["all", "pending", "reposted", "skipped"];

  if (loading) return <div className="p-8 text-text-secondary">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mentions</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-surface p-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
              filter === f
                ? "bg-surface-elevated font-medium text-text"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={AtSign}
          title="No mentions"
          subtitle={filter === "all" ? "No one has tagged you yet" : `No ${filter} mentions`}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((mention) => (
            <Card key={mention.id}>
              <div
                className="mb-3 aspect-square w-full rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${mention.media_url})` }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">@{mention.username}</p>
                  <p className="text-xs text-text-secondary">
                    {formatDistanceToNow(new Date(mention.timestamp), { addSuffix: true })}
                  </p>
                </div>
                {mention.action ? (
                  <Badge variant={mention.action === "reposted" ? "success" : "neutral"}>
                    {mention.action}
                  </Badge>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      loading={actionLoading === mention.id}
                      onClick={() => handleAction(mention.id, "repost")}
                    >
                      Repost
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleAction(mention.id, "skip")}
                    >
                      Skip
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
