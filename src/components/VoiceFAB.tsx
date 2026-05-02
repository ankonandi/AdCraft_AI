import { useState } from "react";
import { Mic } from "lucide-react";
import { VoiceAssistant } from "./VoiceAssistant";
import { cn } from "@/lib/utils";

export function VoiceFAB({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open voice assistant"
        className={cn(
          "fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-4 pr-5 h-14 rounded-full bg-gradient-marigold text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-transform font-bold",
          className
        )}
      >
        <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-primary-foreground/20">
          <Mic className="w-5 h-5" />
          <span className="absolute inset-0 rounded-full bg-primary-foreground/30 animate-ping" />
        </span>
        <span className="hidden sm:inline">Voice</span>
      </button>
      <VoiceAssistant open={open} onClose={() => setOpen(false)} />
    </>
  );
}
