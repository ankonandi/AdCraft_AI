import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, FileText, Megaphone, Zap, Heart, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Sparkles className="w-6 h-6 text-primary" />
            AdCraft AI
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Turn your product photo into
                <span className="text-primary block">ready-to-post content</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                AI-powered catalogue and marketing content generation for independent creators, homepreneurs, and artisans.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="text-lg h-14">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Creating Free
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/generate/description")} className="text-lg h-14">
                  <FileText className="w-5 h-5 mr-2" />
                  Try Demo
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-warm opacity-20 blur-3xl rounded-full" />
              <img
                src={heroImage}
                alt="Artisan products workspace"
                className="relative rounded-2xl shadow-soft w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to sell online
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create professional product listings and engaging marketing campaigns in seconds
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-soft transition-all border-2">
              <CardHeader>
                <FileText className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-2xl">Product Descriptions</CardTitle>
                <CardDescription className="text-base">
                  Generate compelling titles, descriptions, and SEO-optimized content for your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Instant product titles and taglines
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    SEO-friendly descriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Smart category and tag suggestions
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft transition-all border-2">
              <CardHeader>
                <Megaphone className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="text-2xl">Marketing Campaigns</CardTitle>
                <CardDescription className="text-base">
                  Create platform-specific posts with captions, hashtags, and WhatsApp messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Engaging social media captions
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Trending hashtag suggestions
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    WhatsApp selling messages
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Made for Creators</h3>
              <p className="text-muted-foreground">
                Designed specifically for independent sellers, artisans, and homepreneurs
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Generate professional content in seconds, not hours
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Grow Your Business</h3>
              <p className="text-muted-foreground">
                Professional marketing content that helps you sell more
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-warm">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            Ready to transform your product marketing?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join thousands of creators growing their business with AdCraft AI
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="text-lg h-14">
            <Sparkles className="w-5 h-5 mr-2" />
            Start Creating Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>© 2024 AdCraft AI. Empowering creators to grow their business.</p>
        </div>
      </footer>
    </div>
  );
}
