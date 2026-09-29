"use client";

import { useId, useRef, useState } from "react";
import { Bold, Italic, Link2 } from "lucide-react";
import MarkdownText from "./markdown-text";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
};

type Format = { before: string; after: string; placeholder: string };

const FORMATS: Record<"bold" | "italic" | "link", Format> = {
  bold: { before: "**", after: "**", placeholder: "texto en negrita" },
  italic: { before: "*", after: "*", placeholder: "texto en cursiva" },
  link: { before: "[", after: "](https://)", placeholder: "texto del enlace" },
};

export default function RichTextField({
  label,
  value,
  onChange,
  onBlur,
  error,
  maxLength,
  required = false,
  disabled = false,
}: Props) {
  const inputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreview, setIsPreview] = useState(false);

  function applyFormat(format: Format) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd) || format.placeholder;
    const next =
      value.slice(0, selectionStart) +
      format.before +
      selected +
      format.after +
      value.slice(selectionEnd);
    onChange(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const start = selectionStart + format.before.length;
      textarea.setSelectionRange(start, start + selected.length);
    });
  }

  const toolbarButton =
    "cursor-pointer rounded-lg p-2 text-text-muted transition hover:bg-primary-soft hover:text-primary disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="block">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-semibold text-text">
          {label}
          {required && (
            <span className="text-danger" aria-hidden>
              *
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setIsPreview((current) => !current)}
          className="cursor-pointer text-xs font-semibold text-primary hover:text-primary-dark"
        >
          {isPreview ? "Seguir editando" : "Vista previa"}
        </button>
      </div>

      <div
        className={`mt-2 overflow-hidden rounded-xl border bg-surface ${
          error ? "border-danger" : "border-border"
        }`}
      >
        <div className="flex gap-1 border-b border-border px-2 py-1">
          <button type="button" title="Negrita" aria-label="Negrita" className={toolbarButton} disabled={disabled || isPreview} onClick={() => applyFormat(FORMATS.bold)}>
            <Bold size={16} />
          </button>
          <button type="button" title="Cursiva" aria-label="Cursiva" className={toolbarButton} disabled={disabled || isPreview} onClick={() => applyFormat(FORMATS.italic)}>
            <Italic size={16} />
          </button>
          <button type="button" title="Enlace" aria-label="Enlace" className={toolbarButton} disabled={disabled || isPreview} onClick={() => applyFormat(FORMATS.link)}>
            <Link2 size={16} />
          </button>
        </div>

        {isPreview ? (
          <div className="min-h-40 px-4 py-3 text-sm leading-relaxed text-text-muted">
            {value.trim() ? (
              <MarkdownText>{value}</MarkdownText>
            ) : (
              <p className="text-text-subtle">Todavía no hay contenido.</p>
            )}
          </div>
        ) : (
          <textarea
            id={inputId}
            ref={textareaRef}
            value={value}
            rows={8}
            maxLength={maxLength}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            className="block w-full resize-y px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none"
            placeholder="Escribe el contenido. Deja una línea en blanco para separar párrafos."
          />
        )}
      </div>

      <div className="mt-1.5 flex justify-between gap-3 text-xs">
        {error ? (
          <span role="alert" className="text-danger">
            {error}
          </span>
        ) : (
          <span className="text-text-subtle">
            Selecciona un texto y usa los botones para darle formato.
          </span>
        )}
        {maxLength && (
          <span className="shrink-0 tabular-nums text-text-subtle">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
