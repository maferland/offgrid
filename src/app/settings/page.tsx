"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    username?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  async function handleConnect(e: React.FormEvent) {
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
      setStatus({ connected: true, username: data.username });
      setAccessToken("");
      setUserId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      await fetch("/api/auth/disconnect", { method: "POST" });
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

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
            <Button variant="danger" onClick={handleDisconnect} loading={loading}>
              Disconnect
            </Button>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Access Token</label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                placeholder="Your long-lived access token"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-secondary">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                placeholder="Instagram User ID"
              />
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <Button type="submit" loading={loading}>
              Connect
            </Button>
          </form>
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
