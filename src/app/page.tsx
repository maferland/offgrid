"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type Stats = {
  auth: { username: string; expiresAt: string | null } | null;
  pendingCount: number;
  scheduledCount: number;
  publishedCount: number;
  upNext: Array<{ id: string; caption: string | null; scheduledAt: string }>;
  dbConnected: boolean;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="p-8 text-text-secondary">Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {!stats.dbConnected && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="text-sm text-warning">
            Database not connected. Add <code className="rounded bg-surface-elevated px-1">POSTGRES_URL</code> to your Vercel environment variables, then run <code className="rounded bg-surface-elevated px-1">bunx drizzle-kit push</code>.
          </p>
        </Card>
      )}

      {/* Account */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
            {stats.auth?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-medium">
              {stats.auth ? `@${stats.auth.username}` : "Not connected"}
            </p>
            {stats.auth?.expiresAt && (
              <p className="text-xs text-text-secondary">
                Token expires {formatDistanceToNow(new Date(stats.auth.expiresAt), { addSuffix: true })}
              </p>
            )}
          </div>
          <Badge variant={stats.auth ? "success" : "error"}>
            {stats.auth ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-text-secondary">Pending Mentions</p>
          <p className="text-2xl font-semibold">{stats.pendingCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Scheduled</p>
          <p className="text-2xl font-semibold">{stats.scheduledCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Published</p>
          <p className="text-2xl font-semibold">{stats.publishedCount}</p>
        </Card>
      </div>

      {/* Up Next */}
      {stats.upNext.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Up Next</h2>
            <Link href="/queue" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {stats.upNext.map((story) => (
              <Card key={story.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{story.caption || "Untitled"}</p>
                  <p className="text-xs text-text-secondary">
                    {formatDistanceToNow(new Date(story.scheduledAt), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="accent">Scheduled</Badge>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Manual Cron Trigger */}
      <section>
        <h2 className="mb-3 text-lg font-medium">Actions</h2>
        <CronTrigger />
      </section>
    </div>
  );
}

function CronTrigger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function trigger() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cron/trigger", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(`Published: ${data.published}, Failed: ${data.failed}, New mentions: ${data.newMentions}`);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Run Cron Job</p>
        <p className="text-xs text-text-secondary">Publish due stories + check mentions</p>
      </div>
      <div className="flex items-center gap-3">
        {result && <p className="text-xs text-text-secondary">{result}</p>}
        <Button variant="ghost" onClick={trigger} loading={loading}>
          Trigger
        </Button>
      </div>
    </Card>
  );
}
