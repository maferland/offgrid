import { useState, useCallback, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";

type Props = {
  onFile: (file: File, path: string) => void;
};

export function DropZone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) {
        onFile(dropped, dropped.name);
      }
    },
    [onFile],
  );

  const handleBrowse = async () => {
    const path = await open({
      filters: [
        { name: "Media", extensions: ["jpg", "jpeg", "png", "mp4", "mov"] },
      ],
    });
    if (path) {
      // Trigger file input to get the File object for preview
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFile(file, file.name);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
        dragging
          ? "border-accent bg-accent/5"
          : "border-border hover:border-text-secondary"
      }`}
      onClick={handleBrowse}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,video/mp4,video/quicktime"
        onChange={handleInputChange}
        className="hidden"
      />
      <p className="text-text-secondary mb-2">
        Drop a photo or video here
      </p>
      <p className="text-sm text-text-secondary/60">
        JPG, PNG (max 8 MB) or MP4 (max 100 MB, 60s)
      </p>
    </div>
  );
}
