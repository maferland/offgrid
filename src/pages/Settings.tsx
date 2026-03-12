import { useState, useEffect } from "react";
import { api, AuthStatus } from "../lib/tauri";

export function Settings() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState(300);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [status, interval] = await Promise.all([
          api.getAuthStatus(),
          api.getPollingInterval(),
        ]);
        setAuth(status);
        setPollingInterval(interval);
      } catch {
        // Not connected yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const authUrl = await api.startOAuth();
      window.open(authUrl, "_blank");
    } catch (e) {
      console.error("OAuth error:", e);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await api.disconnect();
    setAuth({ connected: false, username: null, expires_at: null });
  };

  const handleIntervalChange = async (seconds: number) => {
    setPollingInterval(seconds);
    await api.setPollingInterval(seconds);
  };

  if (loading) {
    return <p className="text-text-secondary text-sm">Loading...</p>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      <section className="p-4 rounded-lg bg-surface border border-border">
        <h3 className="font-medium mb-3">Instagram Account</h3>
        {auth?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm">
                Connected as <strong>@{auth.username}</strong>
              </span>
            </div>
            {auth.expires_at && (
              <p className="text-xs text-text-secondary">
                Token expires: {new Date(auth.expires_at).toLocaleDateString()}
              </p>
            )}
            <button
              onClick={handleDisconnect}
              className="text-sm text-error hover:underline"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Connect your Instagram Creator account to publish stories and see
              mentions.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {connecting ? "Connecting..." : "Connect Instagram"}
            </button>
          </div>
        )}
      </section>

      <section className="p-4 rounded-lg bg-surface border border-border">
        <h3 className="font-medium mb-3">Mention Polling</h3>
        <label className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">Check every</span>
          <select
            value={pollingInterval}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            className="bg-bg border border-border rounded px-2 py-1 text-sm"
          >
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
            <option value={600}>10 minutes</option>
            <option value={1800}>30 minutes</option>
          </select>
        </label>
      </section>

      <section className="p-4 rounded-lg bg-surface border border-border">
        <h3 className="font-medium mb-2">About</h3>
        <p className="text-sm text-text-secondary">
          Offgrid v0.1.0 — Publish Instagram stories and repost mentions without
          opening the app.
        </p>
      </section>
    </div>
  );
}
