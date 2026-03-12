import { db } from "@/lib/db";
import { auth, scheduledStories, seenMentions } from "@/lib/db/schema";
import { eq, count, and, lte } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [authRow] = await db.select().from(auth).limit(1);
  const [{ value: pendingCount }] = await db
    .select({ value: count() })
    .from(seenMentions)
    .where(eq(seenMentions.action, "pending"));
  const [{ value: scheduledCount }] = await db
    .select({ value: count() })
    .from(scheduledStories)
    .where(eq(scheduledStories.status, "pending"));
  const [{ value: publishedCount }] = await db
    .select({ value: count() })
    .from(scheduledStories)
    .where(eq(scheduledStories.status, "published"));
  const upNext = await db
    .select()
    .from(scheduledStories)
    .where(eq(scheduledStories.status, "pending"))
    .orderBy(scheduledStories.scheduledAt)
    .limit(3);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Account */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
            {authRow?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-medium">
              {authRow ? `@${authRow.username}` : "Not connected"}
            </p>
            {authRow?.expiresAt && (
              <p className="text-xs text-text-secondary">
                Token expires {formatDistanceToNow(authRow.expiresAt, { addSuffix: true })}
              </p>
            )}
          </div>
          <Badge variant={authRow ? "success" : "error"}>
            {authRow ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-text-secondary">Pending Mentions</p>
          <p className="text-2xl font-semibold">{pendingCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Scheduled</p>
          <p className="text-2xl font-semibold">{scheduledCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Published</p>
          <p className="text-2xl font-semibold">{publishedCount}</p>
        </Card>
      </div>

      {/* Up Next */}
      {upNext.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Up Next</h2>
            <Link href="/queue" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {upNext.map((story) => (
              <Card key={story.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{story.caption || "Untitled"}</p>
                  <p className="text-xs text-text-secondary">
                    {formatDistanceToNow(story.scheduledAt, { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="accent">Scheduled</Badge>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
