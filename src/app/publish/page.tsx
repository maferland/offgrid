"use client";

import { useState } from "react";
import { DropZone } from "@/components/drop-zone";
import { PhoneFramePreview } from "@/components/phone-frame-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PublishPage() {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setBlobUrl(data.url);
    setResult(null);
  }

  async function handlePublish() {
    if (!blobUrl) return;
    setPublishing(true);
    setResult(null);
    try {
      if (schedule) {
        const res = await fetch("/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blobUrl, caption, scheduledAt }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResult({ success: true, message: "Story scheduled!" });
      } else {
        const res = await fetch("/api/instagram/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blobUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResult({ success: true, message: `Story published! ID: ${data.storyId}` });
      }
      setBlobUrl(null);
      setCaption("");
      setScheduledAt("");
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Publish Story</h1>
      <div className="grid grid-cols-2 gap-8">
        {/* Preview */}
        <div className="flex items-start justify-center pt-4">
          <PhoneFramePreview src={blobUrl} />
        </div>

        {/* Form */}
        <div className="space-y-4">
          <DropZone onUpload={handleUpload} />

          <Card className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                placeholder="Optional caption..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="schedule"
                checked={schedule}
                onChange={(e) => setSchedule(e.target.checked)}
                className="accent-accent"
              />
              <label htmlFor="schedule" className="text-sm text-text-secondary">
                Schedule for later
              </label>
            </div>

            {schedule && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              />
            )}

            <Button
              onClick={handlePublish}
              loading={publishing}
              disabled={!blobUrl || (schedule && !scheduledAt)}
            >
              {schedule ? "Schedule" : "Publish Now"}
            </Button>

            {result && (
              <p className={`text-sm ${result.success ? "text-success" : "text-error"}`}>
                {result.message}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
