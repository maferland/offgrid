import { useState, useEffect, useCallback } from "react";
import { api, Mention } from "../lib/tauri";
import { MentionCard } from "../components/MentionCard";

export function Mentions() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMentions = useCallback(async () => {
    try {
      const data = await api.getMentions();
      setMentions(data);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentions();
  }, [fetchMentions]);

  const handleRepost = async (mentionId: string) => {
    try {
      await api.repostMention(mentionId);
      setMentions((prev) => prev.filter((m) => m.id !== mentionId));
    } catch (e) {
      setError(String(e));
    }
  };

  const handleSkip = async (mentionId: string) => {
    try {
      await api.skipMention(mentionId);
      setMentions((prev) => prev.filter((m) => m.id !== mentionId));
    } catch (e) {
      setError(String(e));
    }
  };

  const pendingMentions = mentions.filter((m) => !m.seen);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Tagged Stories</h2>
        <button
          onClick={fetchMentions}
          className="text-sm text-text-secondary hover:text-text transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-text-secondary text-sm">Loading mentions...</p>
      ) : pendingMentions.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-lg mb-1">No pending mentions</p>
          <p className="text-sm">
            Stories you're tagged in will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingMentions.map((mention) => (
            <MentionCard
              key={mention.id}
              mention={mention}
              onRepost={handleRepost}
              onSkip={handleSkip}
            />
          ))}
        </div>
      )}
    </div>
  );
}
