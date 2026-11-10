"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const VISIBLE_START = 12;
const VISIBLE_END = 6;

function maskToken(token: string): string {
  if (token.length <= VISIBLE_START + VISIBLE_END) return "•".repeat(token.length);
  return `${token.slice(0, VISIBLE_START)}…${token.slice(-VISIBLE_END)}`;
}

/** Shows an access token masked by default, with a button to reveal it. */
export default function MaskedToken({ token }: Readonly<{ token: string }>) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="rounded-lg bg-slate-900 p-4">
      <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-emerald-400">
        {isVisible ? token : maskToken(token)}
      </pre>
      <button
        type="button"
        aria-pressed={isVisible}
        onClick={() => setIsVisible((current) => !current)}
        className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-400 hover:text-white"
      >
        {isVisible ? <EyeOff size={14} aria-hidden /> : <Eye size={14} aria-hidden />}
        {isVisible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
