import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic, MicOff, Volume2, VolumeX, Upload, Camera, Sparkles, Check, X, Loader2, Languages, ArrowRight, Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  speak, stopSpeaking, listen, isYes, isNo, isRetry, isVoiceFullySupported, type VoiceLang,
} from "@/lib/voiceEngine";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

interface VoiceAssistantProps {
  open: boolean;
  onClose: () => void;
}

type Step =
  | "intro"           // greeting + ask flow choice (only product creation in MVP)
  | "ask-upload"      // prompt user to upload
  | "uploading"       // waiting for file
  | "ask-enhance"     // ask if they want AI enhancement
  | "enhancing"
  | "confirm-image"   // show enhanced image, ask "is this ok?"
  | "ask-details"     // ask for product description
  | "listening-details"
  | "generating"      // calling AI
  | "review"          // show generated content + ask "save?"
  | "saving"
  | "done";

interface FlowState {
  originalImage: string | null;
  enhancedImage: string | null;
  productNote: string;
  generatedTitle: string;
  generatedShort: string;
  generatedLong: string;
  generatedCategory: string;
  generatedTags: string[];
  savedProductId: string | null;
}

const TXT = {
  "en-IN": {
    welcome: "Hello! I am your AdCraft assistant. I will help you create a new product. Are you ready?",
    askUpload: "Great. Please tap the big upload button to add a photo of your product. You can take a picture with your camera or pick one from your phone.",
    gotImage: "Nice photo! Would you like me to enhance it with AI? This will improve lighting and clarity.",
    enhancing: "Enhancing your photo. Please wait a moment.",
    confirmImage: "Here is the enhanced photo. Are you happy with it?",
    askDetails: "Tell me about your product. What is it, what is it made of, and any special details. After you finish, I will create a listing.",
    generating: "Working on your product listing. One moment.",
    reviewIntro: (t: string) => `Here is what I made. The title is: ${t}. Should I save this product to your library?`,
    saving: "Saving your product.",
    done: "All done. Your product is now in your library. You can create a shareable link or a marketing campaign next.",
    notUnderstood: "Sorry, I did not catch that. Could you say yes or no?",
    error: "Something went wrong. Let us try again.",
    micPrompt: "Tap the microphone and speak.",
  },
  "hi-IN": {
    welcome: "Namaste! Main aapka AdCraft assistant hoon. Main aapko ek naya product banane mein madad karunga. Kya aap taiyaar hain?",
    askUpload: "Bahut accha. Kripya bade upload button par tap karein aur apne product ki photo add karein. Aap camera se photo le sakte hain ya phone se choose kar sakte hain.",
    gotImage: "Sundar photo! Kya main isse AI se behtar bana doon? Isse roshni aur clarity badh jayegi.",
    enhancing: "Aapki photo ko enhance kiya ja raha hai. Thoda intezaar karein.",
    confirmImage: "Yeh rahi enhanced photo. Kya aapko yeh pasand hai?",
    askDetails: "Apne product ke baare mein bataiye. Yeh kya hai, kis cheez ka bana hai, aur koi khaas baat. Baat khatam hone ke baad main listing bana dunga.",
    generating: "Aapki product listing taiyaar ki ja rahi hai. Ek pal.",
    reviewIntro: (t: string) => `Yeh dekhiye maine kya banaya. Title hai: ${t}. Kya main isse aapki library mein save kar doon?`,
    saving: "Aapka product save ho raha hai.",
    done: "Sab ho gaya! Aapka product ab library mein hai. Aap shareable link ya marketing campaign bana sakte hain.",
    notUnderstood: "Maaf kijiye, samajh nahi aaya. Kripya haan ya nahi boliye.",
    error: "Kuch galat ho gaya. Phir se koshish karte hain.",
    micPrompt: "Mic dabaiye aur boliye.",
  },
} as const;

export function VoiceAssistant({ open, onClose }: VoiceAssistantProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lang, setLang] = useState<VoiceLang>("en-IN");
  const [step, setStep] = useState<Step>("intro");
  const [muted, setMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partial, setPartial] = useState("");
  const [supported, setSupported] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stopListenRef = useRef<(() => void) | null>(null);
  const stateRef = useRef<FlowState>({
    originalImage: null, enhancedImage: null, productNote: "",
    generatedTitle: "", generatedShort: "", generatedLong: "",
    generatedCategory: "", generatedTags: [], savedProductId: null,
  });
  // Force re-render when stateRef changes
  const [, forceTick] = useState(0);
  const tick = () => forceTick((n) => n + 1);

  const t = TXT[lang];

  useEffect(() => {
    if (open) {
      setSupported(isVoiceFullySupported());
    }
    return () => {
      stopSpeaking();
      stopListenRef.current?.();
    };
  }, [open]);

  // Helper: speak then resolve
  const say = useCallback(async (text: string) => {
    if (muted) return;
    setIsSpeaking(true);
    await speak(text, { lang });
    setIsSpeaking(false);
  }, [lang, muted]);

  // Helper: listen for user reply
  const hear = useCallback((onText: (s: string) => void) => {
    setTranscript("");
    setPartial("");
    setIsListening(true);
    stopListenRef.current?.();
    stopListenRef.current = listen({
      lang,
      onPartial: (s) => setPartial(s),
      onResult: (s) => { setTranscript(s); onText(s); },
      onEnd: () => { setIsListening(false); setPartial(""); },
      onError: (e) => {
        setIsListening(false);
        if (e !== "no-speech" && e !== "aborted") {
          toast({ title: "Mic error", description: e, variant: "destructive" });
        }
      },
    });
  }, [lang, toast]);

  const stopHearing = useCallback(() => {
    stopListenRef.current?.();
    setIsListening(false);
  }, []);

  // ── Flow orchestration ──────────────────────────────────────────
  const startFlow = useCallback(async () => {
    setStep("intro");
    void track("voice_mode_started", { lang });
    await say(t.welcome);
    hear((reply) => {
      if (isYes(reply)) goAskUpload();
      else if (isNo(reply)) onClose();
      else { say(t.notUnderstood).then(() => hear(handleIntroReply)); }
    });
  }, [t, say, hear, onClose, lang]); // eslint-disable-line

  const handleIntroReply = (reply: string) => {
    if (isYes(reply)) goAskUpload();
    else if (isNo(reply)) onClose();
    else say(t.notUnderstood);
  };

  const goAskUpload = useCallback(async () => {
    setStep("ask-upload");
    await say(t.askUpload);
  }, [t, say]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      stateRef.current.originalImage = ev.target?.result as string;
      tick();
      setStep("ask-enhance");
      await say(t.gotImage);
      hear((reply) => {
        if (isYes(reply)) doEnhance();
        else if (isNo(reply)) goAskDetails();
        else { say(t.notUnderstood).then(() => hear((r) => isYes(r) ? doEnhance() : goAskDetails())); }
      });
    };
    reader.readAsDataURL(file);
  };

  const doEnhance = useCallback(async () => {
    setStep("enhancing");
    await say(t.enhancing);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-image", {
        body: { imageData: stateRef.current.originalImage },
      });
      if (error) throw error;
      stateRef.current.enhancedImage = data.enhancedImage;
      void track("image_enhanced", { source: "voice" });
      tick();
      setStep("confirm-image");
      await say(t.confirmImage);
      hear((reply) => {
        if (isYes(reply)) goAskDetails();
        else if (isNo(reply) || isRetry(reply)) doEnhance();
        else { say(t.notUnderstood).then(() => hear((r) => isYes(r) ? goAskDetails() : doEnhance())); }
      });
    } catch (err: any) {
      void track("image_enhance_failed", { source: "voice", message: err.message });
      toast({ title: "Enhancement failed", description: err.message, variant: "destructive" });
      goAskDetails();
    }
  }, [t, say, hear, toast]); // eslint-disable-line

  const goAskDetails = useCallback(async () => {
    setStep("ask-details");
    await say(t.askDetails);
    setStep("listening-details");
    hear((reply) => {
      stateRef.current.productNote = reply;
      tick();
      generateContent();
    });
  }, [t, say, hear]); // eslint-disable-line

  const generateContent = useCallback(async () => {
    setStep("generating");
    await say(t.generating);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "description",
          productInfo: stateRef.current.productNote,
          imageData: stateRef.current.enhancedImage || stateRef.current.originalImage,
        },
      });
      if (error) throw error;
      const c = data.content || {};
      stateRef.current.generatedTitle = c.title || "";
      stateRef.current.generatedShort = c.short_description || "";
      stateRef.current.generatedLong = c.long_description || "";
      stateRef.current.generatedCategory = c.category || "";
      stateRef.current.generatedTags = c.tags || [];
      tick();
      setStep("review");
      await say(t.reviewIntro(stateRef.current.generatedTitle));
      hear((reply) => {
        if (isYes(reply)) saveProduct();
        else if (isNo(reply)) goAskDetails();
        else { say(t.notUnderstood).then(() => hear((r) => isYes(r) ? saveProduct() : goAskDetails())); }
      });
    } catch (err: any) {
      toast({ title: "AI failed", description: err.message, variant: "destructive" });
      setStep("ask-details");
    }
  }, [t, say, hear, toast]); // eslint-disable-line

  const saveProduct = useCallback(async () => {
    setStep("saving");
    await say(t.saving);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const s = stateRef.current;
      const { data, error } = await supabase.from("products").insert({
        user_id: user.id,
        title: s.generatedTitle || "Untitled product",
        short_description: s.generatedShort || null,
        long_description: s.generatedLong || null,
        category: s.generatedCategory || null,
        tags: s.generatedTags.length ? s.generatedTags : null,
        image_url: s.originalImage,
        enhanced_image_url: s.enhancedImage,
      }).select().single();
      if (error) throw error;
      stateRef.current.savedProductId = data.id;
      void track("product_created", { source: "voice", category: data.category });
      tick();
      setStep("done");
      await say(t.done);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
      setStep("review");
    }
  }, [t, say, toast]);

  // Kick off flow when opened
  useEffect(() => {
    if (open && supported) {
      // Slight delay so voices load
      const id = setTimeout(() => { startFlow(); }, 250);
      return () => clearTimeout(id);
    }
  }, [open, supported, lang]); // eslint-disable-line

  if (!open) return null;

  const s = stateRef.current;
  const currentImage = s.enhancedImage || s.originalImage;

  // Big visual prompts based on step
  const renderActiveSurface = () => {
    if (step === "ask-upload" || step === "uploading") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center justify-center gap-3 p-8 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-dashed border-primary/40 hover:border-primary hover:from-primary/25 transition-all min-h-[200px]"
          >
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10" />
            </div>
            <span className="text-lg font-bold">Upload Photo</span>
            <span className="text-sm text-muted-foreground">From your phone</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center justify-center gap-3 p-8 rounded-3xl bg-gradient-to-br from-accent/15 to-accent/5 border-2 border-dashed border-accent/40 hover:border-accent transition-all min-h-[200px]"
          >
            <div className="w-20 h-20 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Camera className="w-10 h-10" />
            </div>
            <span className="text-lg font-bold">Take Picture</span>
            <span className="text-sm text-muted-foreground">Use camera</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      );
    }

    if (step === "enhancing" || step === "generating" || step === "saving") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[240px] gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center animate-pulse">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <Loader2 className="absolute -bottom-1 -right-1 w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="text-lg font-medium text-center">{
            step === "enhancing" ? "Enhancing your photo…" :
            step === "generating" ? "Creating your listing…" :
            "Saving…"
          }</p>
        </div>
      );
    }

    if (currentImage && (step === "ask-enhance" || step === "confirm-image" || step === "ask-details" || step === "listening-details" || step === "review")) {
      return (
        <div className="space-y-4">
          <div className="aspect-square max-h-[280px] mx-auto overflow-hidden rounded-3xl bg-muted shadow-lg">
            <img src={currentImage} alt="Product" className="w-full h-full object-cover" />
          </div>
          {step === "review" && (
            <div className="space-y-2 p-4 rounded-2xl bg-card border border-border">
              <h3 className="font-bold text-lg">{s.generatedTitle}</h3>
              <p className="text-sm text-muted-foreground">{s.generatedShort}</p>
              {s.generatedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {s.generatedTags.slice(0, 5).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-accent/15 text-accent-foreground">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          {(step === "ask-enhance" || step === "confirm-image" || step === "review") && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg" className="h-16 text-lg gap-2"
                onClick={() => {
                  stopHearing();
                  if (step === "ask-enhance") doEnhance();
                  else if (step === "confirm-image") goAskDetails();
                  else if (step === "review") saveProduct();
                }}
              >
                <Check className="w-6 h-6" /> Yes
              </Button>
              <Button
                size="lg" variant="outline" className="h-16 text-lg gap-2"
                onClick={() => {
                  stopHearing();
                  if (step === "ask-enhance") goAskDetails();
                  else if (step === "confirm-image") doEnhance();
                  else if (step === "review") goAskDetails();
                }}
              >
                <X className="w-6 h-6" /> No
              </Button>
            </div>
          )}
          {step === "ask-details" || step === "listening-details" ? (
            <Textarea
              placeholder="Or type product details here…"
              value={s.productNote}
              onChange={(e) => { stateRef.current.productNote = e.target.value; tick(); }}
              rows={3}
            />
          ) : null}
          {step === "listening-details" && s.productNote && (
            <Button size="lg" className="w-full h-14 text-lg" onClick={() => { stopHearing(); generateContent(); }}>
              <ArrowRight className="w-5 h-5 mr-2" /> Continue
            </Button>
          )}
        </div>
      );
    }

    if (step === "done") {
      return (
        <div className="flex flex-col items-center justify-center gap-5 py-8">
          <div className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center">
            <Check className="w-14 h-14 text-success" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-center">{s.generatedTitle || "Product saved!"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <Button size="lg" onClick={() => { onClose(); navigate("/catalog"); }}>
              <Package className="w-5 h-5 mr-2" /> View Library
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              // reset
              stateRef.current = {
                originalImage: null, enhancedImage: null, productNote: "",
                generatedTitle: "", generatedShort: "", generatedLong: "",
                generatedCategory: "", generatedTags: [], savedProductId: null,
              };
              tick();
              startFlow();
            }}>
              <Sparkles className="w-5 h-5 mr-2" /> Add Another
            </Button>
          </div>
        </div>
      );
    }

    // intro / default — show big mic
    return (
      <div className="flex flex-col items-center justify-center min-h-[240px] gap-4">
        <button
          onClick={() => {
            if (isListening) stopHearing();
            else hear((reply) => {
              if (step === "intro") handleIntroReply(reply);
            });
          }}
          className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all",
            isListening ? "bg-destructive text-destructive-foreground scale-110 animate-pulse" : "bg-primary text-primary-foreground hover:scale-105"
          )}
        >
          {isListening ? <MicOff className="w-14 h-14" /> : <Mic className="w-14 h-14" />}
        </button>
        <p className="text-base text-muted-foreground text-center max-w-xs">
          {isListening ? "Listening…" : t.micPrompt}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              isSpeaking ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted"
            )}>
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Voice Assistant</p>
              <p className="text-xs text-muted-foreground">
                {step === "intro" ? "Ready" : `Step: ${step.replace(/-/g, " ")}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopSpeaking();
                setLang((l) => l === "en-IN" ? "hi-IN" : "en-IN");
              }}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-muted text-sm font-medium hover:bg-muted/70"
            >
              <Languages className="w-4 h-4" />
              {lang === "en-IN" ? "EN" : "हिं"}
            </button>
            <button
              onClick={() => {
                setMuted((m) => {
                  if (!m) stopSpeaking();
                  return !m;
                });
              }}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-muted hover:bg-muted/70"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => { stopSpeaking(); stopHearing(); onClose(); }}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-muted hover:bg-destructive/15 hover:text-destructive"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 container mx-auto max-w-2xl px-4 py-6 space-y-5">
          {!supported ? (
            <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-6 text-center space-y-3">
              <p className="font-bold">Voice not supported</p>
              <p className="text-sm text-muted-foreground">
                Your browser does not support voice input. Please use Chrome on Android or Safari on iOS.
              </p>
              <Button onClick={onClose}>Close</Button>
            </div>
          ) : (
            <>
              {/* Last spoken / transcript */}
              {(transcript || partial) && (
                <div className="rounded-2xl bg-muted/60 border border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">You said:</p>
                  <p className="text-sm font-medium">{transcript || partial}</p>
                </div>
              )}

              {renderActiveSurface()}

              {/* Manual mic toggle (always available) */}
              {!["enhancing", "generating", "saving", "done", "ask-upload", "uploading"].includes(step) && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant={isListening ? "destructive" : "outline"}
                    size="lg"
                    className="rounded-full h-14 px-6"
                    onClick={() => {
                      if (isListening) { stopHearing(); }
                      else { hear((reply) => {
                        // best-effort: route by current step
                        if (step === "intro") handleIntroReply(reply);
                        else if (step === "ask-enhance") { isYes(reply) ? doEnhance() : goAskDetails(); }
                        else if (step === "confirm-image") { isYes(reply) ? goAskDetails() : doEnhance(); }
                        else if (step === "ask-details" || step === "listening-details") { stateRef.current.productNote = reply; tick(); generateContent(); }
                        else if (step === "review") { isYes(reply) ? saveProduct() : goAskDetails(); }
                      }); }
                    }}
                  >
                    {isListening ? <><MicOff className="w-5 h-5 mr-2" /> Stop</> : <><Mic className="w-5 h-5 mr-2" /> Speak</>}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
