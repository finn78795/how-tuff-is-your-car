"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    } catch { /* user canceled */ }
  };
  return <button type="button" onClick={share} className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/5 text-white transition hover:bg-white/10" aria-label="Share result">{copied ? <Check className="size-4 text-lime-300" /> : <Share2 className="size-4" />}</button>;
}
