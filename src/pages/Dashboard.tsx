import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Megaphone, Sparkles, History, FolderOpen, Link2, BarChart3, Eye, CalendarCheck, ShoppingBag } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";
import { useRegionalCopy } from "@/hooks/useRegionalCopy";

interface DashboardStats {
  totalProducts: number;
  totalLinks: number;
  totalClicks: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const copy = useRegionalCopy();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ totalProducts: 0, totalLinks: 0, totalClicks: 0 });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchStats(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchStats = async (userId: string) => {
    try {
      // Fetch product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Fetch link count
      const { count: linkCount } = await supabase
        .from('product_links')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Fetch click count through product links
      const { data: userLinks } = await supabase
        .from('product_links')
        .select('id')
        .eq('user_id', userId);

      let clickCount = 0;
      if (userLinks && userLinks.length > 0) {
        const linkIds = userLinks.map(l => l.id);
        const { count } = await supabase
          .from('link_clicks')
          .select('*', { count: 'exact', head: true })
          .in('product_link_id', linkIds);
        clickCount = count || 0;
      }

      setStats({
        totalProducts: productCount || 0,
        totalLinks: linkCount || 0,
        totalClicks: clickCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Greeting */}
          <div className="mb-10 animate-fade-up">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              {copy.greeting} 🙏
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 text-balance">
              Welcome back, {user.user_metadata?.full_name?.split(" ")[0] || "Creator"}!
            </h1>
            <p className="text-muted-foreground text-lg">
              {copy.dashboardSubline}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10">
            {[
              { icon: FolderOpen, label: "Products", value: stats.totalProducts, tint: "bg-primary/10 text-primary" },
              { icon: Link2, label: "Links", value: stats.totalLinks, tint: "bg-accent/10 text-accent" },
              { icon: Eye, label: "Clicks", value: stats.totalClicks, tint: "bg-success/10 text-success" },
            ].map(({ icon: Icon, label, value, tint }) => (
              <Card key={label} className="rounded-2xl border border-border/70 shadow-card">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-xl ${tint}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="font-display text-2xl sm:text-3xl font-bold leading-none">{value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Actions */}
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: FileText,
                title: "New Product",
                desc: "Upload a photo, get title, description & tags.",
                cta: "Create Product",
                onClick: () => navigate("/generate/description"),
                gradient: "bg-gradient-marigold text-primary-foreground",
              },
              {
                icon: Megaphone,
                title: "Marketing Campaign",
                desc: "Captions, hashtags & creative posts in seconds.",
                cta: "Create Campaign",
                onClick: () => navigate("/generate/campaign"),
                gradient: "bg-gradient-indigo text-primary-foreground",
              },
              {
                icon: ShoppingBag,
                title: "Post to Ecommerce",
                desc: "Generate SEO listings + CSV for Amazon, Flipkart & Meesho.",
                cta: "Open Generator",
                onClick: () => navigate("/ecommerce"),
                gradient: "bg-gradient-indigo text-primary-foreground",
              },
              {
                icon: CalendarCheck,
                title: "Social Media Hub",
                desc: "Schedule posts and track performance.",
                cta: "Open Hub",
                onClick: () => navigate("/social/dashboard"),
                gradient: "bg-card border-2 border-border text-foreground",
              },
            ].map(({ icon: Icon, title, desc, cta, onClick, gradient }) => (
              <Card
                key={title}
                onClick={onClick}
                className="group cursor-pointer rounded-3xl border-2 border-border/70 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className={`p-5 ${gradient}`}>
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur">
                    <Icon className="w-6 h-6" strokeWidth={2.2} />
                  </span>
                </div>
                <CardContent className="pt-5 pb-6 px-5">
                  <h3 className="font-display text-xl font-bold mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-pretty">{desc}</p>
                  <Button className="w-full rounded-xl group-hover:shadow-soft" size="lg">
                    {cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Links */}
          <h2 className="font-display text-xl font-bold mb-3 text-foreground/80">Quick links</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: FolderOpen, title: "Product Catalog", desc: "View & manage products", to: "/catalog" },
              { icon: History, title: "Activity History", desc: "Recent generations", to: "/history" },
              { icon: BarChart3, title: "Link Analytics", desc: "Track your link clicks", to: "/catalog" },
            ].map(({ icon: Icon, title, desc, to }) => (
              <Card
                key={title}
                onClick={() => navigate(to)}
                className="rounded-2xl border border-border/70 cursor-pointer hover:border-primary/50 hover:shadow-card transition-all"
              >
                <CardContent className="p-5 flex items-start gap-3">
                  <span className="p-2.5 rounded-xl bg-muted text-foreground/70">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
