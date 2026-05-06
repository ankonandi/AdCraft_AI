import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  FileText,
  Megaphone,
  Zap,
  Heart,
  TrendingUp,
  Camera,
  Share2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useRegionalCopy } from "@/hooks/useRegionalCopy";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function Index() {
  const navigate = useNavigate();
  const copy = useRegionalCopy();

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-display text-xl font-bold">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-marigold shadow-soft">
              <Sparkles className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </span>
            AdCraft <span className="text-primary">AI</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:inline-flex">
              Sign in
            </Button>
            <Button onClick={() => navigate("/auth")} className="rounded-xl shadow-soft">
              Get started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        {/* decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-tertiary/20 blur-3xl animate-blob" />

        <div className="relative container mx-auto max-w-6xl px-4 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-7 animate-fade-up">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-card text-xs font-semibold text-foreground/80">
                <span className="inline-block w-2 h-2 rounded-full bg-success" />
                {copy.madeFor}
              </span>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-balance">
                {copy.heroLine1}
                <span className="block bg-gradient-warm bg-clip-text text-transparent">
                  {copy.heroLine2}
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-xl text-pretty">
                Take a photo of your product. We&rsquo;ll write the description, design the post,
                and get it ready for Instagram, Facebook & WhatsApp — in seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="text-base h-14 rounded-2xl shadow-soft px-7"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/generate/description")}
                  className="text-base h-14 rounded-2xl px-7 bg-card"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Try with a photo
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success" /> Free to start
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Ready in seconds
                </div>
              </div>
            </div>

            <div className="relative animate-fade-up [animation-delay:120ms]">
              <div className="absolute -inset-6 bg-gradient-warm opacity-30 blur-3xl rounded-[3rem]" />
              <div className="relative rounded-[2rem] overflow-hidden shadow-elevated border border-border/60 bg-card">
                <img
                  src={heroImage}
                  alt="Indian artisan products styled for online catalogue"
                  className="w-full h-full object-cover aspect-[4/5]"
                  loading="eager"
                />
                {/* floating cards */}
                <div className="absolute top-5 left-5 px-3 py-2 rounded-xl bg-card/95 backdrop-blur shadow-soft border border-border/60 text-xs font-semibold flex items-center gap-2 animate-float-slow">
                  <span className="w-6 h-6 rounded-md bg-primary/15 inline-flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5 text-primary" />
                  </span>
                  Photo uploaded
                </div>
                <div className="absolute bottom-6 right-5 px-3 py-2 rounded-xl bg-card/95 backdrop-blur shadow-soft border border-border/60 text-xs font-semibold flex items-center gap-2 animate-float-slow [animation-delay:1.5s]">
                  <span className="w-6 h-6 rounded-md bg-success/15 inline-flex items-center justify-center">
                    <Share2 className="w-3.5 h-3.5 text-success" />
                  </span>
                  Caption ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">How it works</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-balance">
              {copy.howItWorks}
            </h2>
            <p className="text-lg text-muted-foreground">
              No tech skills needed. Just your phone, your product, and one tap.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", icon: Camera, title: "Take a photo", desc: "Snap your product with any phone camera." },
              { step: "2", icon: Sparkles, title: "AI does the magic", desc: "Get titles, descriptions, captions and hashtags." },
              { step: "3", icon: Share2, title: "Post & sell", desc: "Share to Instagram, Facebook or WhatsApp directly." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <Card key={step} className="relative border-2 border-border/70 bg-card rounded-3xl shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300">
                <CardContent className="pt-8 pb-7 px-7">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="font-display text-3xl font-bold text-primary/30">{step}</span>
                    <span className="w-12 h-12 rounded-2xl bg-gradient-marigold flex items-center justify-center shadow-soft">
                      <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.2} />
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-pretty">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/40 border-y border-border/60">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-2 border-border/70 bg-card overflow-hidden shadow-card hover:shadow-soft transition-all">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-2">Product Listings</h3>
                <p className="text-muted-foreground mb-5">
                  Compelling titles, SEO-friendly descriptions, smart tags — written for you.
                </p>
                <ul className="space-y-2.5 text-sm">
                  {["Catchy product titles", "Search-friendly descriptions", "Smart category & tags"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-success/15 text-success inline-flex items-center justify-center">
                        <Zap className="w-3 h-3" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border/70 bg-gradient-indigo text-accent-foreground overflow-hidden shadow-card hover:shadow-soft transition-all">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/30 flex items-center justify-center mb-5">
                  <Megaphone className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-2 text-primary-foreground">Marketing Posts</h3>
                <p className="text-primary-foreground/80 mb-5">
                  Captions, hashtags & WhatsApp messages — ready to post.
                </p>
                <ul className="space-y-2.5 text-sm text-primary-foreground/90">
                  {["Engaging social captions", "Trending hashtags", "WhatsApp selling messages"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/30 inline-flex items-center justify-center">
                        <Zap className="w-3 h-3" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Heart, title: "Made for Indian creators", desc: "Designed for artisans, homepreneurs and local sellers." },
              { icon: Zap, title: "Fast & simple", desc: "Professional content in seconds — no design skills needed." },
              { icon: TrendingUp, title: "Sell more", desc: "Reach more customers on Instagram, Facebook and WhatsApp." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-marigold flex items-center justify-center mx-auto shadow-soft">
                  <Icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold">{title}</h3>
                <p className="text-muted-foreground text-pretty max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-marigold p-10 md:p-16 text-center shadow-elevated">
            <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 bg-primary-foreground/15 rounded-full blur-3xl" />
            <div aria-hidden className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/30 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-primary-foreground text-balance">
                {copy.startToday}
              </h2>
              <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Thousands of creators are already growing their business with AdCraft AI.
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/auth")}
                className="text-base h-14 rounded-2xl px-8 shadow-soft"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create free account
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 px-4 border-t border-border/60 bg-card/50">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-display font-semibold text-foreground">
            <Sparkles className="w-4 h-4 text-primary" /> AdCraft AI
          </div>
          <p>© 2026 AdCraft AI · Empowering Indian creators.</p>
        </div>
      </footer>
    </div>
  );
}
