import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { ProductSelector } from "@/components/ProductSelector";
import {
  Calendar,
  Clock,
  Link2,
  Send,
  Sparkles,
  Globe,
  Tag,
  ArrowLeft,
} from "lucide-react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "facebook", label: "Facebook", icon: "📘" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
];

const GOALS = [
  { id: "awareness", label: "Brand Awareness" },
  { id: "engagement", label: "Engagement" },
  { id: "traffic", label: "Drive Traffic" },
  { id: "sales", label: "Sales / Promo" },
];

interface Collection {
  id: string;
  name: string;
  slug: string;
}

export default function SchedulePost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products, isLoading: isLoadingProducts, getProductImage } = useProducts();

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState("engagement");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [linkType, setLinkType] = useState("none");
  const [customUrl, setCustomUrl] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  // Auto-populate UTM fields based on platform/goal
  useEffect(() => {
    if (selectedPlatforms.length > 0 && !utmSource) {
      setUtmSource(selectedPlatforms[0]);
    }
    if (selectedPlatforms.length > 0 && !utmMedium) {
      setUtmMedium("social");
    }
  }, [selectedPlatforms]);

  const fetchCollections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("product_collections")
      .select("id, name, slug")
      .eq("user_id", user.id)
      .eq("is_active", true);
    setCollections(data || []);
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const buildFinalUrl = () => {
    let baseUrl = "";
    if (linkType === "collection" && selectedCollectionId) {
      const coll = collections.find((c) => c.id === selectedCollectionId);
      if (coll) baseUrl = `${window.location.origin}/c/${coll.slug}`;
    } else if (linkType === "product" && selectedProductId) {
      baseUrl = `${window.location.origin}/p/${selectedProductId}`;
    } else if (linkType === "custom" && customUrl) {
      baseUrl = customUrl;
    }

    if (!baseUrl) return "";

    const params = new URLSearchParams();
    if (utmSource) params.set("utm_source", utmSource);
    if (utmMedium) params.set("utm_medium", utmMedium);
    if (utmCampaign) params.set("utm_campaign", utmCampaign);
    if (utmContent) params.set("utm_content", utmContent);

    const paramStr = params.toString();
    return paramStr ? `${baseUrl}?${paramStr}` : baseUrl;
  };

  const handleSave = async (publish: boolean = false) => {
    if (!caption.trim()) {
      toast({ title: "Caption required", variant: "destructive" });
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast({ title: "Select at least one platform", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const scheduledFor = scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : null;

      const hashtagArray = hashtags
        .split(/[\s,#]+/)
        .filter(Boolean)
        .map((t) => t.replace(/^#/, ""));

      const finalUrl = buildFinalUrl();

      const status = publish ? "scheduled" : "draft";

      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: user.id,
        caption,
        hashtags: hashtagArray,
        platforms: selectedPlatforms,
        goal: selectedGoal,
        status,
        scheduled_for: scheduledFor,
        link_type: linkType,
        link_url: finalUrl || null,
        collection_id: linkType === "collection" ? selectedCollectionId || null : null,
        product_id: linkType === "product" ? selectedProductId || null : null,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        utm_content: utmContent || null,
      });

      if (error) throw error;

      toast({
        title: publish ? "Post scheduled! 🚀" : "Draft saved",
        description: publish
          ? `Scheduled for ${selectedPlatforms.join(", ")}`
          : "You can edit and schedule it later",
      });
      navigate("/social/dashboard");
    } catch (error: any) {
      toast({ title: "Error saving post", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const finalUrl = buildFinalUrl();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/social/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Social Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Schedule a Post</h1>
            <p className="text-muted-foreground">
              Create, schedule, and track your social media posts
            </p>
          </div>

          <div className="space-y-6">
            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Post Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Write your post caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {caption.length} characters
                  </p>
                </div>
                <div>
                  <Label htmlFor="hashtags">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Hashtags
                  </Label>
                  <Input
                    id="hashtags"
                    placeholder="#fashion #sale #trending"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Platforms & Goal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Platforms & Goal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-3 block">Select Platforms</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePlatformToggle(p.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          selectedPlatforms.includes(p.id)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <span className="text-lg">{p.icon}</span>
                        <span className="text-sm font-medium">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-3 block">Campaign Goal</Label>
                  <RadioGroup value={selectedGoal} onValueChange={setSelectedGoal}>
                    <div className="grid grid-cols-2 gap-3">
                      {GOALS.map((g) => (
                        <div key={g.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={g.id} id={`goal-${g.id}`} />
                          <Label htmlFor={`goal-${g.id}`} className="cursor-pointer">{g.label}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Link & UTM */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  Link & Tracking
                </CardTitle>
                <CardDescription>
                  Attach a link and UTM parameters to track performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Link Type</Label>
                  <Select value={linkType} onValueChange={setLinkType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Link</SelectItem>
                      <SelectItem value="collection">Collection Storefront</SelectItem>
                      <SelectItem value="product">Single Product</SelectItem>
                      <SelectItem value="custom">Custom URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {linkType === "collection" && (
                  <div>
                    <Label className="mb-2 block">Select Collection</Label>
                    <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {linkType === "product" && (
                  <div>
                    <Label className="mb-2 block">Select Product</Label>
                    <ProductSelector
                      products={products}
                      isLoading={isLoadingProducts}
                      value={selectedProductId}
                      onValueChange={setSelectedProductId}
                      placeholder="Choose a product"
                      getProductImage={getProductImage}
                    />
                  </div>
                )}

                {linkType === "custom" && (
                  <div>
                    <Label htmlFor="custom-url">Custom URL</Label>
                    <Input
                      id="custom-url"
                      placeholder="https://your-store.com/product"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}

                {linkType !== "none" && (
                  <>
                    <div className="pt-2 border-t">
                      <Label className="mb-3 block text-sm font-semibold">UTM Parameters</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="utm-source" className="text-xs">Source</Label>
                          <Input
                            id="utm-source"
                            placeholder="instagram"
                            value={utmSource}
                            onChange={(e) => setUtmSource(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="utm-medium" className="text-xs">Medium</Label>
                          <Input
                            id="utm-medium"
                            placeholder="social"
                            value={utmMedium}
                            onChange={(e) => setUtmMedium(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="utm-campaign" className="text-xs">Campaign</Label>
                          <Input
                            id="utm-campaign"
                            placeholder="summer-sale"
                            value={utmCampaign}
                            onChange={(e) => setUtmCampaign(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="utm-content" className="text-xs">Content</Label>
                          <Input
                            id="utm-content"
                            placeholder="post-1"
                            value={utmContent}
                            onChange={(e) => setUtmContent(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {finalUrl && (
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-xs text-muted-foreground">Preview URL</Label>
                        <p className="text-xs font-mono mt-1 break-all">{finalUrl}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => handleSave(false)}
                disabled={isSaving}
              >
                Save as Draft
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                <Send className="w-4 h-4 mr-2" />
                {scheduledDate ? "Schedule Post" : "Publish Now"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
