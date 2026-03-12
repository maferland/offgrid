"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    username?: string;
    expiresAt?: string;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});

    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) setMessage({ type: "success", text: "Instagram connected!" });
    if (error) setMessage({ type: "error", text: decodeURIComponent(error) });
  }, [searchParams]);

  async function handleDisconnect() {
    setLoading(true);
    try {
      await fetch("/api/auth/disconnect", { method: "POST" });
      setStatus({ connected: false });
      setMessage(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {message && (
        <Card className={message.type === "error" ? "border-error/30 bg-error/5" : "border-success/30 bg-success/5"}>
          <p className={`text-sm ${message.type === "error" ? "text-error" : "text-success"}`}>
            {message.text}
          </p>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Instagram Account</h2>
          <Badge variant={status?.connected ? "success" : "error"}>
            {status?.connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        {status?.connected ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Logged in as <span className="font-medium text-text">@{status.username}</span>
            </p>
            {status.expiresAt && (
              <p className="text-xs text-text-muted">
                Token expires {formatDistanceToNow(new Date(status.expiresAt), { addSuffix: true })}
                {" "}(auto-refreshes)
              </p>
            )}
            <Button variant="danger" onClick={handleDisconnect} loading={loading}>
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Connect your Instagram Business or Creator account via Facebook OAuth.
            </p>
            <a href="/api/auth/instagram">
              <Button>Connect with Instagram</Button>
            </a>
            <ManualConnect onConnected={(username) => {
              setStatus({ connected: true, username });
              setMessage({ type: "success", text: "Connected!" });
            }} />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-medium">About</h2>
        <p className="text-sm text-text-secondary">
          Offgrid — Instagram story manager. Publish, schedule, and manage tagged mentions from one place.
        </p>
      </Card>
    </div>
  );
}

function ManualConnect({ onConnected }: { onConnected: (username: string) => void }) {
  const [open, setOpen] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-text-muted hover:text-text-secondary"
      >
        Or connect manually with a token
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onConnected(data.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-4">
      <p className="text-xs text-text-muted">Manual token entry</p>
      <input
        type="password"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        required
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        placeholder="Long-lived access token"
      />
      <input
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        required
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        placeholder="Instagram User ID"
      />
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" loading={loading} variant="ghost">
        Connect
      </Button>
    </form>
  );
}
