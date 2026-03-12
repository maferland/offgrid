"use client";

import Image from "next/image";

export function PhoneFramePreview({ src }: { src: string | null }) {
  return (
    <div className="relative mx-auto w-[260px] overflow-hidden rounded-[2.5rem] border-2 border-border bg-black">
      {/* Notch */}
      <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      {/* Screen */}
      <div className="aspect-[9/16] w-full bg-surface">
        {src ? (
          <Image
            src={src}
            alt="Story preview"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            No media selected
          </div>
        )}
      </div>
    </div>
  );
}
