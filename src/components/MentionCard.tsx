import { useState } from "react";
import { Mention } from "../lib/tauri";

type Props = {
  mention: Mention;
  onRepost: (id: string) => Promise<void>;
  onSkip: (id: string) => Promise<void>;
};

export function MentionCard({ mention, onRepost, onSkip }: Props) {
  const [acting, setActing] = useState(false);

  const handle = async (action: () => Promise<void>) => {
    setActing(true);
    try {
      await action();
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="flex gap-4 p-4 rounded-xl bg-surface border border-border">
      <div className="w-20 h-36 rounded-lg overflow-hidden bg-black shrink-0">
        {mention.media_type === "IMAGE" ? (
          <img
            src={mention.media_url}
            alt={`Story by @${mention.username}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={mention.media_url}
            className="w-full h-full object-cover"
            muted
          />
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <p className="font-medium text-sm">@{mention.username}</p>
          <p className="text-xs text-text-secondary mt-1">
            {new Date(mention.timestamp).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handle(() => onRepost(mention.id))}
            disabled={acting}
            className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors"
          >
            Repost
          </button>
          <button
            onClick={() => handle(() => onSkip(mention.id))}
            disabled={acting}
            className="border border-border text-text-secondary hover:bg-surface-hover text-sm py-1.5 px-4 rounded-lg transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
