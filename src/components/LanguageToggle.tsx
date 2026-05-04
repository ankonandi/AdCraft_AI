import { Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { getLanguageOverride, setLanguageOverride, type LangCode } from "@/lib/regionalCopy";
import { useRegionalCopy } from "@/hooks/useRegionalCopy";
import { cn } from "@/lib/utils";

export const LanguageToggle = ({ className }: { className?: string }) => {
  const copy = useRegionalCopy();
  const [override, setOverride] = useState<LangCode | null>(getLanguageOverride());

  useEffect(() => {
    const onChange = () => setOverride(getLanguageOverride());
    window.addEventListener("adcraft:lang-changed", onChange);
    return () => window.removeEventListener("adcraft:lang-changed", onChange);
  }, []);

  const isEnglish = override === "en" || copy.lang === "en";

  const toggle = () => {
    if (isEnglish) {
      // Clear override → fall back to detected language
      setLanguageOverride(null);
    } else {
      setLanguageOverride("en");
    }
  };

  const label = isEnglish ? copy.langLabel : "English";

  return (
    <button
      onClick={toggle}
      title={`Switch to ${label}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 h-9 rounded-xl text-xs font-medium border border-border bg-card text-foreground/80 hover:bg-muted transition-colors",
        className,
      )}
    >
      <Languages className="w-3.5 h-3.5" />
      {isEnglish ? "EN" : copy.langLabel}
      <span className="text-foreground/40">→</span>
      <span className="text-primary">{isEnglish ? copy.langLabel : "EN"}</span>
    </button>
  );
};
