"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Crop, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import Button from "@/components/ui/button";
import { normalizePhotoCrop } from "../photo-crop";
import type { PhotoCrop } from "../types/content-types";
import CroppedPhoto from "./cropped-photo";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const PREVIEW_SIZE = 112;

type FieldProps = {
  imageUrl: string;
  imageAlt: string;
  crop: PhotoCrop | null;
  isOpen: boolean;
  disabled?: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChange: (crop: PhotoCrop) => void;
};

/**
 * Circular preview of the team member photo with a dialog to choose the visible area.
 */
export default function PhotoCropField({
  imageUrl,
  imageAlt,
  crop,
  isOpen,
  disabled = false,
  onOpen,
  onClose,
  onChange,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-muted/40 p-4 sm:flex-row sm:items-center">
      <CroppedPhoto
        src={imageUrl}
        alt={imageAlt}
        crop={crop}
        size={PREVIEW_SIZE}
        className="h-28 w-28 shrink-0 self-center border-4 border-surface shadow-md sm:self-auto"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-semibold text-text">Foto del círculo</p>
        <p className="text-xs text-text-subtle">
          Así se verá en la sección de equipo. La foto completa se sigue mostrando al abrir el
          perfil.
        </p>
        <button
          type="button"
          onClick={onOpen}
          disabled={disabled}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Crop size={16} aria-hidden />
          Ajustar recorte
        </button>
      </div>

      {isOpen && (
        <PhotoCropDialog
          imageUrl={imageUrl}
          initialCrop={crop}
          onCancel={onClose}
          onApply={(area) => {
            onChange(area);
            onClose();
          }}
        />
      )}
    </div>
  );
}

type DialogProps = {
  imageUrl: string;
  initialCrop: PhotoCrop | null;
  onCancel: () => void;
  onApply: (crop: PhotoCrop) => void;
};

function PhotoCropDialog({ imageUrl, initialCrop, onCancel, onApply }: DialogProps) {
  const titleId = useId();
  const zoomId = useId();
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<PhotoCrop | null>(initialCrop);
  const [startCrop, setStartCrop] = useState<PhotoCrop | undefined>(initialCrop ?? undefined);
  const [cropperKey, setCropperKey] = useState(0);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel]);

  const handleCropComplete = useCallback((croppedArea: Area) => {
    setArea(normalizePhotoCrop(croppedArea));
  }, []);

  function centerCrop() {
    setStartCrop(undefined);
    setPosition({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setCropperKey((key) => key + 1);
  }

  const changeZoom = (value: number) =>
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100)));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border/60 bg-surface shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start gap-4 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-xl text-text">
              Ajustar foto del círculo
            </h2>
            <p className="mt-1 text-xs text-text-subtle">
              Arrastra la foto para moverla y usa el control para acercarla. En el celular también
              puedes pellizcar.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="cursor-pointer rounded-lg p-1 text-text-subtle transition hover:bg-surface-muted hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative h-[min(55dvh,26rem)] w-full shrink-0 bg-black">
          <Cropper
            key={cropperKey}
            image={imageUrl}
            crop={position}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            aspect={1}
            cropShape="round"
            showGrid={false}
            initialCroppedAreaPercentages={startCrop}
            onCropChange={setPosition}
            onZoomChange={changeZoom}
            onCropComplete={handleCropComplete}
            mediaProps={{ alt: "" }}
          />
        </div>

        <div className="flex items-center gap-3 px-5 pt-4">
          <button
            type="button"
            onClick={() => changeZoom(zoom - 0.25)}
            aria-label="Alejar"
            className="cursor-pointer rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text"
          >
            <ZoomOut size={18} />
          </button>
          <label htmlFor={zoomId} className="sr-only">
            Acercamiento
          </label>
          <input
            id={zoomId}
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => changeZoom(Number(event.target.value))}
            className="h-2 min-w-0 flex-1 cursor-pointer accent-primary"
          />
          <button
            type="button"
            onClick={() => changeZoom(zoom + 0.25)}
            aria-label="Acercar"
            className="cursor-pointer rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-text"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={centerCrop}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-muted transition hover:text-primary"
          >
            <RotateCcw size={16} aria-hidden />
            Centrar
          </button>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={() => area && onApply(area)} disabled={!area}>
              Aplicar recorte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
