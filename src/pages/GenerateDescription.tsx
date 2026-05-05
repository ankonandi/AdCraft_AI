import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Copy, Link2, ArrowRight, ArrowLeft, Check, Package, ImageIcon, FileText, Eye } from "lucide-react";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { CreateProductLinkModal } from "@/components/CreateProductLinkModal";

const STEPS_FULL = [
  { id: 1, label: "Upload & Enhance", icon: ImageIcon },
  { id: 2, label: "Product Details", icon: FileText },
  { id: 3, label: "Review & Edit", icon: Eye },
  { id: 4, label: "Done", icon: Check },
];

const STEPS_SKIP = [
  { id: 1, label: "Upload Photo", icon: ImageIcon },
  { id: 2, label: "Product Details", icon: FileText },
  { id: 3, label: "Review & Edit", icon: Eye },
  { id: 4, label: "Done", icon: Check },
];

export default function GenerateDescription() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [productNote, setProductNote] = useState("");
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [images, setImages] = useState<{ original: string; enhanced: string | null }[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields after generation
  const [editTitle, setEditTitle] = useState("");
  const [editShortDesc, setEditShortDesc] = useState("");
  const [editLongDesc, setEditLongDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");

  const primaryImage = images[primaryIndex]
    ? images[primaryIndex].enhanced || images[primaryIndex].original
    : null;

  const handleImagesChange = (imgs: { original: string; enhanced: string | null }[], primary: number) => {
    setImages(imgs);
    setPrimaryIndex(primary);
  };

  const activeSteps = STEPS_FULL;

  const handleGenerate = async () => {
    if (!productNote.trim() && images.length === 0) {
      toast({
        title: "Add product details",
        description: "Please describe your product or upload a photo",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          type: 'description',
          productInfo: productNote,
          imageData: primaryImage,
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      // Populate editable fields
      setEditTitle(data.content.title || "");
      setEditShortDesc(data.content.short_description || "");
      setEditLongDesc(data.content.long_description || "");
      setEditCategory(data.content.category || "");
      setEditTags((data.content.tags || []).join(", "));

      setStep(3);
      toast({ title: "Description generated! ✨" });
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!editTitle.trim()) {
      toast({ title: "Title required", description: "Give your product a name", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const parsedTags = editTags.split(",").map(t => t.trim()).filter(Boolean);

      const { data, error } = await supabase.from('products').insert({
        user_id: user.id,
        title: editTitle.trim(),
        short_description: editShortDesc.trim() || null,
        long_description: editLongDesc.trim() || null,
        category: editCategory.trim() || null,
        tags: parsedTags.length > 0 ? parsedTags : null,
        image_url: images[primaryIndex]?.original || null,
        enhanced_image_url: images[primaryIndex]?.enhanced || null,
        image_urls: images.map((i) => i.original),
        enhanced_image_urls: images.map((i) => i.enhanced || ""),
      }).select().single();

      if (error) throw error;

      setSavedProductId(data.id);
      setStep(4);
      toast({ title: "Product created! 🎉", description: "Added to your Product Library" });
    } catch (error: any) {
      toast({ title: "Failed to create product", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New Product</h1>
            <p className="text-muted-foreground">
              Upload a photo, let AI do the heavy lifting, then add it to your library
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8 px-2">
            {activeSteps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isComplete = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isComplete ? "bg-primary text-primary-foreground" :
                      isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs font-medium ${isActive || isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < activeSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 mt-[-1.25rem] ${
                      step > s.id ? "bg-primary" : "bg-secondary"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1: Upload & Enhance Image */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Product Photo
                  </CardTitle>
                  <CardDescription>Upload one or more product images — enhance each as needed, then continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <MultiImageUploader onChange={handleImagesChange} />
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={images.length === 0} size="lg">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Product Details (notes + AI generation) */}
          {step === 2 && !isGenerating && (
            <div className="space-y-6">
              {/* Show current image preview */}
              {primaryImage && (
                <div className="aspect-video overflow-hidden rounded-xl bg-secondary max-h-48">
                  <img src={primaryImage} alt="Product" className="w-full h-full object-cover" />
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Tell us about your product
                  </CardTitle>
                  <CardDescription>Help AI generate better titles, descriptions & tags <span className="text-destructive">(required)</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="E.g., Handmade leather wallet, premium quality, vegetable-tanned leather…"
                    value={productNote}
                    onChange={(e) => setProductNote(e.target.value)}
                    rows={3}
                    required
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-shrink-0">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={!productNote.trim()}
                      className="flex-1"
                      size="lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with AI
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Generating (loading state) */}
          {step === 2 && isGenerating && (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 animate-pulse">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">AI is crafting your product listing…</h2>
                <p className="text-muted-foreground">Generating title, description, tags & more</p>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review & Edit */}
          {step === 3 && generatedContent && (
            <div className="space-y-6">
              {/* Product Preview Image */}
              {(enhancedImage || originalImage) && (
                <div className="aspect-video overflow-hidden rounded-xl bg-secondary">
                  <img
                    src={enhancedImage || originalImage || ''}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Review & Edit Your Product
                  </CardTitle>
                  <CardDescription>AI-generated content — feel free to tweak anything</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit-title" className="text-sm font-semibold">Product Title</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(editTitle)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input
                      id="edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit-short" className="text-sm font-semibold">Short Description</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(editShortDesc)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <Textarea
                      id="edit-short"
                      value={editShortDesc}
                      onChange={(e) => setEditShortDesc(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit-long" className="text-sm font-semibold">Full Description</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(editLongDesc)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <Textarea
                      id="edit-long"
                      value={editLongDesc}
                      onChange={(e) => setEditLongDesc(e.target.value)}
                      rows={5}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-category" className="text-sm font-semibold">Category</Label>
                      <Input
                        id="edit-category"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-tags" className="text-sm font-semibold">Tags (comma-separated)</Label>
                      <Input
                        id="edit-tags"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tag pills preview */}
                  {editTags && (
                    <div className="flex flex-wrap gap-2">
                      {editTags.split(",").map((t, i) => t.trim()).filter(Boolean).map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Primary CTA */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-shrink-0">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleCreateProduct}
                  disabled={isSaving || !editTitle.trim()}
                  className="flex-1"
                  size="lg"
                >
                  {isSaving ? (
                    <>Creating…</>
                  ) : (
                    <>
                      <Package className="w-5 h-5 mr-2" />
                      Add to Product Library
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <Card className="border-primary">
              <CardContent className="py-12 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Product Created! 🎉</h2>
                  <p className="text-muted-foreground">
                    <strong>{editTitle}</strong> has been added to your Product Library
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Button onClick={() => setShowLinkModal(true)} className="flex-1" size="lg">
                    <Link2 className="w-4 h-4 mr-2" />
                    Create Shareable Link
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/generate/campaign")} className="flex-1" size="lg">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <Button variant="ghost" onClick={() => navigate("/catalog")}>
                    View Product Library
                  </Button>
                  <Button variant="ghost" onClick={() => {
                    setStep(1);
                    setGeneratedContent(null);
                    setSavedProductId(null);
                    setProductNote("");
                    setOriginalImage(null);
                    setEnhancedImage(null);
                    setEditTitle("");
                    setEditShortDesc("");
                    setEditLongDesc("");
                    setEditCategory("");
                    setEditTags("");
                    setSkippedEnhancement(false);
                  }}>
                    Create Another Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {savedProductId && (
        <CreateProductLinkModal
          productId={savedProductId}
          productTitle={editTitle || "Product"}
          open={showLinkModal}
          onOpenChange={setShowLinkModal}
          onLinkCreated={() => navigate("/catalog")}
        />
      )}
    </div>
  );
}
