import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Calendar,
  BarChart3,
  Send,
  Clock,
  Eye,
  MousePointerClick,
  TrendingUp,
  Trash2,
  ExternalLink,
  Copy,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

interface ScheduledPost {
  id: string;
  caption: string;
  hashtags: string[];
  platforms: string[];
  goal: string | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  link_type: string | null;
  link_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  image_urls: string[];
}

interface PostMetrics {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalClicks: number;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "outline" },
  published: { label: "Published", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: "📸",
  facebook: "📘",
  whatsapp: "💬",
};

export default function SocialDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [metrics, setMetrics] = useState<PostMetrics>({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    totalClicks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsData = (data || []) as ScheduledPost[];
      setPosts(postsData);

      // Calculate metrics
      const totalClicks = 0; // Will come from post_analytics later
      setMetrics({
        totalPosts: postsData.length,
        scheduledPosts: postsData.filter((p) => p.status === "scheduled").length,
        publishedPosts: postsData.filter((p) => p.status === "published").length,
        totalClicks,
      });
    } catch (error: any) {
      toast({ title: "Error loading posts", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("scheduled_posts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Post deleted" });
      fetchPosts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Post marked as published! 🚀" });
      fetchPosts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!" });
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === "all") return true;
    return p.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Social Media Hub</h1>
              <p className="text-muted-foreground">
                Schedule, publish, and track your social media posts
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/social/schedule")}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.totalPosts}</p>
                    <p className="text-xs text-muted-foreground">Total Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.scheduledPosts}</p>
                    <p className="text-xs text-muted-foreground">Scheduled</p>
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
                    <p className="text-2xl font-bold">{metrics.publishedPosts}</p>
                    <p className="text-xs text-muted-foreground">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MousePointerClick className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.totalClicks}</p>
                    <p className="text-xs text-muted-foreground">Link Clicks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posts List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Posts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All ({posts.length})</TabsTrigger>
                  <TabsTrigger value="draft">
                    Drafts ({posts.filter((p) => p.status === "draft").length})
                  </TabsTrigger>
                  <TabsTrigger value="scheduled">
                    Scheduled ({posts.filter((p) => p.status === "scheduled").length})
                  </TabsTrigger>
                  <TabsTrigger value="published">
                    Published ({posts.filter((p) => p.status === "published").length})
                  </TabsTrigger>
                </Tabs>

                <div className="space-y-4">
                  {isLoading ? (
                    <p className="text-center py-8 text-muted-foreground">Loading posts...</p>
                  ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-4">No posts yet</p>
                      <Button onClick={() => navigate("/social/schedule")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Post
                      </Button>
                    </div>
                  ) : (
                    filteredPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onDelete={handleDelete}
                        onPublish={handlePublish}
                        onCopyLink={copyLink}
                      />
                    ))
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function PostCard({
  post,
  onDelete,
  onPublish,
  onCopyLink,
}: {
  post: ScheduledPost;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onCopyLink: (url: string) => void;
}) {
  const statusInfo = STATUS_MAP[post.status] || STATUS_MAP.draft;

  return (
    <div className="p-4 border rounded-lg hover:shadow-card transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Platforms + Status */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              {post.platforms.map((p) => (
                <span key={p} className="text-base" title={p}>
                  {PLATFORM_EMOJI[p] || "📱"}
                </span>
              ))}
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {post.goal && (
              <Badge variant="outline" className="text-xs">
                {post.goal}
              </Badge>
            )}
          </div>

          {/* Caption preview */}
          <p className="text-sm line-clamp-2 mb-2">{post.caption}</p>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.hashtags.slice(0, 5).map((tag, i) => (
                <span key={i} className="text-xs text-primary">#{tag}</span>
              ))}
              {post.hashtags.length > 5 && (
                <span className="text-xs text-muted-foreground">+{post.hashtags.length - 5} more</span>
              )}
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {post.scheduled_for && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(post.scheduled_for), "MMM d, yyyy h:mm a")}
              </span>
            )}
            {post.link_url && (
              <span className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {post.link_type}
              </span>
            )}
            {post.utm_source && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                utm: {post.utm_source}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {post.link_url && (
            <Button variant="ghost" size="icon" onClick={() => onCopyLink(post.link_url!)}>
              <Copy className="w-4 h-4" />
            </Button>
          )}
          {post.status === "draft" || post.status === "scheduled" ? (
            <Button variant="ghost" size="icon" onClick={() => onPublish(post.id)} title="Mark as published">
              <Send className="w-4 h-4" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(post.id)}
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
