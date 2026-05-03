// Browser-native speech engine: STT (Web Speech API) + TTS (Speech Synthesis).
// MVP scope: Hindi (hi-IN) + English (en-IN).
// Graceful: detects unsupported browsers and exposes capability flags.

export type VoiceLang = "hi-IN" | "en-IN";

export interface SpeakOptions {
  lang?: VoiceLang;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

export interface ListenOptions {
  lang?: VoiceLang;
  onPartial?: (text: string) => void;
  onResult: (finalText: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
}

// Capability detection
export function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  // @ts-ignore - webkit prefix
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isVoiceFullySupported(): boolean {
  return !!getSpeechRecognition() && isSpeechSynthesisSupported();
}

// Pick the best installed voice for a given lang
function pickVoice(lang: VoiceLang): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Exact match first
  let v = voices.find((vo) => vo.lang === lang);
  if (v) return v;
  // Same language family
  const prefix = lang.split("-")[0];
  v = voices.find((vo) => vo.lang.startsWith(prefix + "-"));
  if (v) return v;
  // Fallback: any voice
  return voices[0] || null;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

/** Speak text. Cancels any in-flight utterance. */
export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported() || !text.trim()) {
      opts.onEnd?.();
      resolve();
      return;
    }
    try {
      window.speechSynthesis.cancel();
    } catch { /* noop */ }

    const u = new SpeechSynthesisUtterance(text);
    const lang = opts.lang || "en-IN";
    u.lang = lang;
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;

    u.onend = () => {
      currentUtterance = null;
      opts.onEnd?.();
      resolve();
    };
    u.onerror = () => {
      currentUtterance = null;
      opts.onEnd?.();
      resolve();
    };

    currentUtterance = u;
    // Some browsers need voices to be loaded asynchronously
    if (!window.speechSynthesis.getVoices().length) {
      window.speechSynthesis.onvoiceschanged = () => {
        const v2 = pickVoice(lang);
        if (v2) u.voice = v2;
        window.speechSynthesis.speak(u);
      };
    } else {
      window.speechSynthesis.speak(u);
    }
  });
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
  }
  currentUtterance = null;
}

// Ensure microphone permission is granted (browsers can silently fail otherwise)
async function ensureMicPermission(): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately release the mic — SpeechRecognition will request its own
      stream.getTracks().forEach((t) => t.stop());
      return true;
    }
  } catch {
    return false;
  }
  return true;
}

/** Start listening. Returns a stop function.
 *  Uses continuous mode + auto-restart on transient stops so users get a long
 *  window to speak. Caller must explicitly call stop() when done. */
export function listen(opts: ListenOptions): () => void {
  const SR = getSpeechRecognition();
  if (!SR) {
    opts.onError?.("speech-recognition-unsupported");
    return () => {};
  }

  let stopped = false;
  let recog: any = null;
  let finalText = "";
  let lastSpeechAt = Date.now();
  let silenceTimer: any = null;

  // Stop after ~2s of silence following any captured speech
  const SILENCE_MS = 2000;
  // Hard cap on a single listening session
  const MAX_MS = 30000;
  const startedAt = Date.now();

  const finish = () => {
    if (stopped) return;
    stopped = true;
    if (silenceTimer) clearTimeout(silenceTimer);
    try { recog?.stop(); } catch { /* noop */ }
    if (finalText.trim()) opts.onResult(finalText.trim());
    opts.onEnd?.();
  };

  const armSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (finalText.trim()) finish();
    }, SILENCE_MS);
  };

  const buildRecognizer = () => {
    const r = new SR();
    r.lang = opts.lang || "en-IN";
    r.interimResults = true;
    r.continuous = true;
    r.maxAlternatives = 1;

    r.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript + " ";
        else interim += res[0].transcript;
      }
      if (interim) {
        opts.onPartial?.(interim);
        lastSpeechAt = Date.now();
      }
      if (finalText) {
        lastSpeechAt = Date.now();
        armSilenceTimer();
      }
    };

    r.onerror = (e: any) => {
      const err = e?.error || "unknown";
      // 'no-speech' and 'aborted' are transient — auto-restart unless user stopped
      if (stopped) return;
      if (err === "no-speech" || err === "aborted" || err === "audio-capture") {
        return; // onend will fire and we restart there
      }
      opts.onError?.(err);
    };

    r.onend = () => {
      if (stopped) return;
      // Auto-restart unless we've hit max time or have a final result + silence
      if (Date.now() - startedAt > MAX_MS) { finish(); return; }
      if (finalText.trim() && Date.now() - lastSpeechAt > SILENCE_MS) { finish(); return; }
      try {
        r.start();
      } catch {
        // Fresh recognizer if start() throws
        recog = buildRecognizer();
        try { recog.start(); } catch { finish(); }
      }
    };
    return r;
  };

  // Kick off (after permission)
  ensureMicPermission().then((ok) => {
    if (stopped) return;
    if (!ok) { opts.onError?.("mic-permission-denied"); opts.onEnd?.(); return; }
    recog = buildRecognizer();
    try { recog.start(); } catch (e: any) {
      opts.onError?.(e?.message || "start-failed");
      opts.onEnd?.();
    }
  });

  return () => {
    finish();
  };
}

// --- Lightweight intent matching (works across Hindi-Latin + English) ---
const YES_WORDS = ["yes", "yeah", "yep", "yup", "ok", "okay", "sure", "fine", "good", "haan", "ha", "ji", "thik", "theek", "sahi", "haanji", "correct", "right", "perfect", "ho gaya"];
const NO_WORDS = ["no", "nope", "nah", "nahi", "nahin", "mat", "cancel", "stop", "galat", "wrong", "back"];
const SKIP_WORDS = ["skip", "next", "chod", "chhod", "aage", "aage badho", "continue"];
const RETRY_WORDS = ["retry", "again", "phir se", "dobara", "redo", "wapas", "change", "badlo"];

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/[.,!?;:'"()]/g, "");
}

function containsAny(s: string, words: string[]): boolean {
  const n = ` ${normalize(s)} `;
  return words.some((w) => n.includes(` ${w} `));
}

export function isYes(s: string): boolean { return containsAny(s, YES_WORDS); }
export function isNo(s: string): boolean { return containsAny(s, NO_WORDS); }
export function isSkip(s: string): boolean { return containsAny(s, SKIP_WORDS); }
export function isRetry(s: string): boolean { return containsAny(s, RETRY_WORDS); }

// Extract a phone number from a transcript: digits, "double", "triple", spaces
export function extractPhone(s: string): string | null {
  // Convert words like "double 5" → "55", "triple 7" → "777"
  const tokens = normalize(s).split(/\s+/);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "double" && tokens[i + 1] && /^\d$/.test(tokens[i + 1])) {
      out.push(tokens[i + 1].repeat(2)); i++;
    } else if (t === "triple" && tokens[i + 1] && /^\d$/.test(tokens[i + 1])) {
      out.push(tokens[i + 1].repeat(3)); i++;
    } else if (/^\d+$/.test(t)) {
      out.push(t);
    }
  }
  const digits = out.join("").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return null;
}
