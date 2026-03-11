import { useState, useCallback } from "react";
import { api, PublishResult } from "../lib/tauri";
import { DropZone } from "../components/DropZone";
import { MediaPreview } from "../components/MediaPreview";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

type FileState = {
  path: string;
  name: string;
  size: number;
  type: "image" | "video";
  previewUrl: string;
};

function validateFile(file: File): string | null {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) return "Unsupported file type. Use JPG, PNG, or MP4.";
  if (isImage && file.size > MAX_IMAGE_SIZE) return "Image must be under 8 MB.";
  if (isVideo && file.size > MAX_VIDEO_SIZE) return "Video must be under 100 MB.";

  return null;
}

export function Publish() {
  const [file, setFile] = useState<FileState | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((selectedFile: File, path: string) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setResult(null);
    setFile({
      path,
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type.startsWith("image/") ? "image" : "video",
      previewUrl: URL.createObjectURL(selectedFile),
    });
  }, []);

  const handlePublish = async () => {
    if (!file) return;

    setPublishing(true);
    setResult(null);
    setError(null);

    try {
      const res = await api.publishStory(file.path);
      setResult(res);
      if (res.success) setFile(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setPublishing(false);
    }
  };

  const handleClear = () => {
    if (file) URL.revokeObjectURL(file.previewUrl);
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">Publish Story</h2>

      {!file ? (
        <DropZone onFile={handleFile} />
      ) : (
        <div className="space-y-4">
          <MediaPreview file={file} />

          <div className="flex gap-3">
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              {publishing ? "Publishing..." : "Publish Story"}
            </button>
            <button
              onClick={handleClear}
              disabled={publishing}
              className="px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {result?.success && (
        <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
          Story published! ID: {result.story_id}
        </div>
      )}

      {(error || result?.error) && (
        <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error || result?.error}
        </div>
      )}
    </div>
  );
}
