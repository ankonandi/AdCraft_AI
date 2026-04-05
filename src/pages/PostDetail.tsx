import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Copy,
  ExternalLink,
  TrendingUp,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";

const PLATFORM_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  instagram: { label: "Instagram", icon: "📸", color: "bg-pink-500/10 text-pink-600" },
  facebook: { label: "Facebook", icon: "📘", color: "bg-blue-500/10 text-blue-600" },
  whatsapp: { label: "WhatsApp", icon: "💬", color: "bg-green-500/10 text-green-600" },
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [publishingPlatform, setPublishingPlatform] = useState<string | null>(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error: any) {
      toast({ title: "Error loading post", description: error.message, variant: "destructive" });
      navigate("/social/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishPlatform = async (platform: string) => {
    setPublishingPlatform(platform);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/publish-post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ postId: id, platform }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Publishing failed");
      }

      if (data.result?.success) {
        toast({ title: `Published to ${PLATFORM_CONFIG[platform]?.label}! 🚀` });
      } else {
        toast({
          title: `Failed to publish to ${PLATFORM_CONFIG[platform]?.label}`,
          description: data.result?.error || "Unknown error",
          variant: "destructive",
        });
      }

      fetchPost();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setPublishingPlatform(null);
    }
  };

  const handleCopyCaption = () => {
    if (!post) return;
    let text = post.caption;
    if (post.hashtags?.length) text += "\n\n" + post.hashtags.map((h: string) => `#${h}`).join(" ");
    if (post.link_url) text += "\n\n🔗 " + post.link_url;
    navigator.clipboard.writeText(text);
    toast({ title: "Caption copied!" });
  };

  const getPlatformStatus = (platform: string) => {
    const results = (post?.publish_results || {}) as Record<string, any>;
    return results[platform] || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/social/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Post Preview */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Post Preview</span>
                    <Badge variant={post.status === "published" ? "default" : post.status === "scheduled" ? "outline" : "secondary"}>
                      {post.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Images */}
                  {post.image_urls?.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {post.image_urls.map((url: string, i: number) => (
                        <img key={i} src={url} alt={`Post image ${i + 1}`} className="rounded-lg w-full aspect-square object-cover border" />
                      ))}
                    </div>
                  )}

                  {/* Caption */}
                  <div className="relative">
                    <p className="whitespace-pre-wrap text-sm">{post.caption}</p>
                    <Button variant="ghost" size="icon" className="absolute top-0 right-0" onClick={handleCopyCaption}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Hashtags */}
                  {post.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="text-xs text-primary font-medium">#{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Link */}
                  {post.link_url && (
                    <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-xs font-mono break-all">{post.link_url}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* UTM & Tracking Info */}
              {(post.utm_source || post.utm_medium || post.utm_campaign) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      UTM Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {post.utm_source && <div><span className="text-muted-foreground">Source:</span> <span className="font-medium">{post.utm_source}</span></div>}
                      {post.utm_medium && <div><span className="text-muted-foreground">Medium:</span> <span className="font-medium">{post.utm_medium}</span></div>}
                      {post.utm_campaign && <div><span className="text-muted-foreground">Campaign:</span> <span className="font-medium">{post.utm_campaign}</span></div>}
                      {post.utm_content && <div><span className="text-muted-foreground">Content:</span> <span className="font-medium">{post.utm_content}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Publish Controls */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Publish to Platforms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(post.platforms as string[]).map((platform) => {
                    const config = PLATFORM_CONFIG[platform];
                    const status = getPlatformStatus(platform);
                    const isPublishing = publishingPlatform === platform;

                    return (
                      <div key={platform} className="p-3 rounded-lg border space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{config?.icon}</span>
                            <span className="font-medium text-sm">{config?.label}</span>
                          </div>
                          {status?.success ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Published
                            </Badge>
                          ) : status?.error ? (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" /> Failed
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                          )}
                        </div>

                        {status?.error && (
                          <p className="text-xs text-destructive">{status.error}</p>
                        )}

                        {status?.platformPostId && (
                          <p className="text-xs text-muted-foreground">Post ID: {status.platformPostId}</p>
                        )}

                        {!status?.success && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handlePublishPlatform(platform)}
                            disabled={isPublishing}
                          >
                            {isPublishing ? (
                              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Publishing...</>
                            ) : (
                              <><Send className="w-3 h-3 mr-1" /> Publish Now</>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Schedule Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {post.scheduled_for && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Scheduled: {format(new Date(post.scheduled_for), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  )}
                  {post.published_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Published: {format(new Date(post.published_at), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  )}
                  {post.goal && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span>Goal: {post.goal}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span>{post.image_urls?.length || 0} images</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
