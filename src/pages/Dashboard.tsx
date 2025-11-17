import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Megaphone, Sparkles, History, FolderOpen } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

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
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="hover:shadow-soft transition-all cursor-pointer" onClick={() => navigate("/catalog")}>
              <CardHeader className="pb-3">
                <FolderOpen className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Product Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View saved products</p>
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

            <Card className="hover:shadow-soft transition-all cursor-pointer">
              <CardHeader className="pb-3">
                <Sparkles className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Learn best practices</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
