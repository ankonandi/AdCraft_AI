import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { Mic, Sparkles, Languages, Upload, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function VoiceMode() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/auth");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-marigold shadow-soft mb-5">
              <Mic className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-display mb-3">
              Just talk. We'll do the rest.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Bina padhe-likhe bhi product list karein. Apni bhasha mein boliye — Hindi ya English.
            </p>
          </div>

          <Button size="lg" className="h-16 px-10 text-xl rounded-full shadow-lg" onClick={() => setOpen(true)}>
            <Mic className="w-6 h-6 mr-3" /> Start Voice Mode
          </Button>

          {/* Steps preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            {[
              { icon: Mic, title: "Speak", desc: "Tap mic and tell us what you want" },
              { icon: Upload, title: "Upload Photo", desc: "From phone or click a picture" },
              { icon: Check, title: "Done", desc: "Product saved automatically" },
            ].map((s, i) => (
              <div key={i} className="p-5 rounded-2xl bg-card border border-border text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-3">
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
            <Languages className="w-4 h-4" />
            <span>Currently supports: English (India) and Hindi</span>
          </div>
        </div>
      </main>

      <VoiceAssistant open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
