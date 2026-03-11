type Props = {
  file: {
    name: string;
    size: number;
    type: "image" | "video";
    previewUrl: string;
  };
};

export function MediaPreview({ file }: Props) {
  const sizeMB = (file.size / 1024 / 1024).toFixed(1);

  return (
    <div className="rounded-xl overflow-hidden bg-surface border border-border">
      <div className="aspect-[9/16] max-h-96 flex items-center justify-center bg-black">
        {file.type === "image" ? (
          <img
            src={file.previewUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={file.previewUrl}
            controls
            className="max-w-full max-h-full"
          />
        )}
      </div>
      <div className="p-3 flex items-center justify-between text-sm text-text-secondary">
        <span className="truncate">{file.name}</span>
        <span className="shrink-0 ml-2">{sizeMB} MB</span>
      </div>
    </div>
  );
}
