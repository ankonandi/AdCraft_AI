import { useEffect, useState } from "react";
import { detectLanguage, getCopyFor, type LangCode, type RegionalCopy } from "@/lib/regionalCopy";

// Default to Hindi flavor while detection resolves (India-targeted product).
const DEFAULT: LangCode = "hi";

export function useRegionalCopy(): RegionalCopy {
  const [lang, setLang] = useState<LangCode>(DEFAULT);

  useEffect(() => {
    let cancelled = false;
    detectLanguage().then((l) => {
      if (!cancelled) setLang(l);
    });
    return () => { cancelled = true; };
  }, []);

  return getCopyFor(lang);
}
