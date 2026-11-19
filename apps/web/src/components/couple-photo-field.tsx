import { useState } from "react";
import { removeBackground as removeImageBackground } from "@imgly/background-removal";

import { toast } from "@/components/toaster";
import { ENV } from "@/env.public";

/** Output side. Smaller sources are not upscaled. */
const SIDE = 800;
/** Scan size for finding the subject. Alpha bounds only need coarse resolution. */
const SCAN = 512;
/** Alpha above this counts as subject, so faint edge fringes don't widen the box. */
const ALPHA_MIN = 16;
/** Room around the subject so hands and hats are not cut at the edge. */
const PADDING = 1.1;

type Stage = { label: string; percent: number } | null;
type Box = { x: number; y: number; w: number; h: number };

/** Public URL for a stored couple photo key, or undefined when none is set. */
export function couplePhotoUrl(key: string | null): string | undefined {
  if (!key) return undefined;
  return `${ENV.VITE_SERVER_URL}/photos/${key}`;
}

function newCanvas(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot process images");
  return ctx;
}

/** Bounding box of pixels whose alpha is above `ALPHA_MIN`. Null when nothing is opaque. */
function subjectBox(rgba: Uint8ClampedArray, width: number, height: number): Box | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] > ALPHA_MIN) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Square around the box's centre, padded, kept inside the image and never larger than it. */
function squareAround(box: Box, width: number, height: number): Box {
  const side = Math.min(Math.max(box.w, box.h) * PADDING, width, height);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const x = Math.min(Math.max(0, cx - side / 2), width - side);
  const y = Math.min(Math.max(0, cy - side / 2), height - side);
  return { x, y, w: side, h: side };
}

/** Removes the background in the browser. Model download and inference report through `onStage`. */
async function removeBackground(file: File, onStage: (stage: Stage) => void): Promise<Blob> {
  return removeImageBackground(file, {
    model: "small",
    output: { format: "image/png" },
    progress: (key, current, total) => {
      const label = key.startsWith("fetch") ? "Downloading model" : "Removing background";
      onStage({ label, percent: total > 0 ? Math.round((current / total) * 100) : 0 });
    },
  });
}

/** Crops the cutout around its subject and encodes WebP. Throws when no subject is found. */
async function toCoupleWebp(cutout: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(cutout);
  const scale = Math.min(1, SCAN / Math.max(bitmap.width, bitmap.height));
  const scanW = Math.max(1, Math.round(bitmap.width * scale));
  const scanH = Math.max(1, Math.round(bitmap.height * scale));
  const scan = newCanvas(scanW, scanH);
  scan.drawImage(bitmap, 0, 0, scanW, scanH);
  const found = subjectBox(scan.getImageData(0, 0, scanW, scanH).data, scanW, scanH);
  if (!found) {
    bitmap.close();
    throw new Error("No people found in this photo");
  }
  const box = squareAround(
    { x: found.x / scale, y: found.y / scale, w: found.w / scale, h: found.h / scale },
    bitmap.width,
    bitmap.height,
  );
  const out = Math.min(SIDE, box.w);
  const ctx = newCanvas(out, out);
  ctx.drawImage(bitmap, box.x, box.y, box.w, box.h, 0, 0, out, out);
  bitmap.close();
  const { promise, resolve } = Promise.withResolvers<Blob | null>();
  ctx.canvas.toBlob(resolve, "image/webp", 0.9);
  const blob = await promise;
  if (!blob) throw new Error("This browser cannot encode WebP");
  return blob;
}

async function uploadCoupleWebp(blob: Blob, invitationId: string): Promise<string> {
  const url = `${ENV.VITE_SERVER_URL}/api/photo/couple?invitation=${encodeURIComponent(invitationId)}`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "image/webp" },
    body: blob,
  });
  const body = (await res.json()) as { key?: string; message?: string };
  if (!res.ok || !body.key) throw new Error(body.message ?? `Upload failed (${res.status})`);
  return body.key;
}

/** Host picks a photo for one invitation; the background is removed in the browser, then it is cropped and uploaded. `onUploaded` receives the new key. */
export function CouplePhotoField({ invitationId, onUploaded }: { invitationId: string; onUploaded: (key: string) => void }) {
  const [stage, setStage] = useState<Stage>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    try {
      const cutout = await removeBackground(file, setStage);
      setStage({ label: "Uploading", percent: 100 });
      onUploaded(await uploadCoupleWebp(await toCoupleWebp(cutout), invitationId));
      toast.success("Couple photo saved");
    } catch (error) {
      toast.error("Could not use this photo", {
        description: error instanceof Error ? error.message : "Try a JPEG, PNG, or WebP photo",
      });
    } finally {
      setStage(null);
    }
  }

  return (
    <div className="grid gap-1 text-sm">
      <label className="grid gap-1">
        Couple photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={stage !== null}
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </label>
      {stage && (
        <div role="status" aria-live="polite" className="grid gap-1">
          <span className="text-xs text-muted-foreground">
            {stage.label}… {stage.percent}%
          </span>
          <progress className="w-full" max={100} value={stage.percent} />
        </div>
      )}
    </div>
  );
}
