"use client";

import { useCallback, useState, DragEvent } from "react";
import { Upload } from "lucide-react";
import { Spinner } from "./ui/spinner";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "video/mp4"];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export function DropZone({
  onUpload,
}: {
  onUpload: (file: File) => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only JPG, PNG, or MP4 files are supported");
        return;
      }
      const maxSize = file.type.startsWith("video/") ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        setError(`File too large (max ${maxSize / 1024 / 1024}MB)`);
        return;
      }
      setUploading(true);
      try {
        await onUpload(file);
      } catch {
        setError("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
        dragging
          ? "border-accent bg-accent-dim"
          : "border-border hover:border-text-muted"
      }`}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ACCEPTED_TYPES.join(",");
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleFile(file);
        };
        input.click();
      }}
    >
      {uploading ? (
        <Spinner />
      ) : (
        <>
          <Upload className="mb-2 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">
            Drop media here or click to browse
          </p>
          <p className="mt-1 text-xs text-text-muted">
            JPG, PNG up to 8MB &middot; MP4 up to 100MB
          </p>
        </>
      )}
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
