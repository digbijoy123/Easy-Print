"use client";

import { useEffect, useRef, useState } from "react";

type EditValues = {
  crop: number;
  rotation: 0 | 90 | 180 | 270;
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: boolean;
};

const DEFAULT_EDIT: EditValues = {
  crop: 0,
  rotation: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: false,
};

function drawPreview(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  edit: EditValues
) {
  const naturalW = image.naturalWidth || 1;
  const naturalH = image.naturalHeight || 1;
  const trim = Math.min(edit.crop, 45) / 100;
  const cropW = Math.max(1, Math.round(naturalW * (1 - trim * 2)));
  const cropH = Math.max(1, Math.round(naturalH * (1 - trim * 2)));
  const sx = Math.round((naturalW - cropW) / 2);
  const sy = Math.round((naturalH - cropH) / 2);
  const rotated = edit.rotation === 90 || edit.rotation === 270;

  canvas.width = rotated ? cropH : cropW;
  canvas.height = rotated ? cropW : cropH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((edit.rotation * Math.PI) / 180);
  ctx.filter = [
    `brightness(${edit.brightness}%)`,
    `contrast(${edit.contrast}%)`,
    `saturate(${edit.grayscale ? 0 : edit.saturation}%)`,
  ].join(" ");
  ctx.drawImage(image, sx, sy, cropW, cropH, -cropW / 2, -cropH / 2, cropW, cropH);
  ctx.restore();
}

export default function PhotoEditor({
  file,
  onSave,
  onClose,
}: {
  file: { name: string; url: string };
  onSave: (url: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [edit, setEdit] = useState<EditValues>(DEFAULT_EDIT);
  const [saving, setSaving] = useState(false);

  const editRef = useRef<EditValues>(edit);
  editRef.current = edit;

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      if (canvasRef.current) drawPreview(canvasRef.current, image, editRef.current);
    };
    image.src = file.url;

    return () => {
      image.onload = null;
    };
  }, [file.url]);

  useEffect(() => {
    if (canvasRef.current && imageRef.current) {
      drawPreview(canvasRef.current, imageRef.current, edit);
    }
  }, [edit]);

  function update<K extends keyof EditValues>(key: K, value: EditValues[K]) {
    setEdit((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setEdit(DEFAULT_EDIT);
  }

  async function save() {
    if (!canvasRef.current || !imageRef.current) return;
    setSaving(true);

    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) {
          setSaving(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        onSave(url);
        setSaving(false);
        onClose();
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div className="editor-backdrop" role="dialog" aria-modal="true" aria-label="Edit photo">
      <section className="editor-modal">
        <header className="editor-header">
          <div>
            <p className="eyebrow">PHOTO EDITOR</p>
            <strong>{file.name}</strong>
          </div>
          <button className="editor-close" onClick={onClose} aria-label="Close editor">×</button>
        </header>

        <div className="editor-preview">
          <canvas ref={canvasRef} />
        </div>

        <div className="editor-tools">
          <div className="tool-section">
            <span className="tool-label">Crop</span>
            <div className="tool-buttons">
              {[0, 10, 20, 30, 40].map((value) => (
                <button
                  key={value}
                  className={edit.crop === value ? "tool-button active" : "tool-button"}
                  onClick={() => update("crop", value)}
                >
                  {value === 0 ? "Original" : `Trim ${value}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="tool-section">
            <span className="tool-label">Rotate</span>
            <div className="tool-buttons">
              {[0, 90, 180, 270].map((value) => (
                <button
                  key={value}
                  className={edit.rotation === value ? "tool-button active" : "tool-button"}
                  onClick={() => update("rotation", value as EditValues["rotation"])}
                >
                  {value === 0 ? "0°" : `↻ ${value}°`}
                </button>
              ))}
            </div>
          </div>

          <label className="range-tool">
            <span>Brightness <strong>{edit.brightness}%</strong></span>
            <input
              type="range"
              min="60"
              max="140"
              value={edit.brightness}
              onChange={(event) => update("brightness", Number(event.target.value))}
            />
          </label>

          <label className="range-tool">
            <span>Contrast <strong>{edit.contrast}%</strong></span>
            <input
              type="range"
              min="60"
              max="140"
              value={edit.contrast}
              onChange={(event) => update("contrast", Number(event.target.value))}
            />
          </label>

          <label className="range-tool">
            <span>Saturation <strong>{edit.saturation}%</strong></span>
            <input
              type="range"
              min="0"
              max="160"
              value={edit.saturation}
              onChange={(event) => update("saturation", Number(event.target.value))}
            />
          </label>

          <label className="check-tool">
            <input
              type="checkbox"
              checked={edit.grayscale}
              onChange={(event) => update("grayscale", event.target.checked)}
            />
            <span>Black &amp; white preview</span>
          </label>
        </div>

        <footer className="editor-footer">
          <button className="secondary-button" onClick={reset}>Reset</button>
          <button className="primary-button editor-save" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save edited photo"}
            <span>✓</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
