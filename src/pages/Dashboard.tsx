import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Megaphone, Sparkles, History, FolderOpen, Link2, BarChart3, Eye } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

interface DashboardStats {
  totalProducts: number;
  totalLinks: number;
  totalClicks: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
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
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-3">Welcome back! 👋</h1>
            <p className="text-muted-foreground text-lg">
              What would you like to create today?
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Link2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalLinks}</p>
                    <p className="text-xs text-muted-foreground">Links</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalClicks}</p>
                    <p className="text-xs text-muted-foreground">Total Clicks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card 
              className="cursor-pointer hover:shadow-soft transition-all duration-300 border-2 hover:border-primary"
              onClick={() => navigate("/generate/description")}
            >
              <CardHeader>
                <FileText className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Product Description</CardTitle>
                <CardDescription>
                  Upload a photo and get compelling product descriptions, titles, and tags
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg">
                  Generate Description
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-soft transition-all duration-300 border-2 hover:border-primary"
              onClick={() => navigate("/generate/campaign")}
            >
              <CardHeader>
                <Megaphone className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Marketing Campaign</CardTitle>
                <CardDescription>
                  Create engaging captions, hashtags, and creative posts for your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg">
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="hover:shadow-soft transition-all cursor-pointer" onClick={() => navigate("/catalog")}>
              <CardHeader className="pb-3">
                <FolderOpen className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Product Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View & manage products</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft transition-all cursor-pointer" onClick={() => navigate("/history")}>
              <CardHeader className="pb-3">
                <History className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Recent generations</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-soft transition-all cursor-pointer" onClick={() => navigate("/catalog")}>
              <CardHeader className="pb-3">
                <BarChart3 className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Link Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Track your link clicks</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
