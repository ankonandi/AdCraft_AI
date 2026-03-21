import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Copy, Package } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useProducts } from "@/hooks/useProducts";
import { ProductSelector } from "@/components/ProductSelector";

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "facebook", label: "Facebook" },
];

const GOALS = [
  { id: "awareness", label: "Awareness" },
  { id: "engagement", label: "Engagement" },
  { id: "orders", label: "WhatsApp Orders" },
  { id: "sale", label: "Sale / Promo" },
];

// Remove inline Product interface and fetching - use shared hook

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    if (productId === "none") {
      setProductInfo("");
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductInfo(`${product.title}${product.short_description ? `: ${product.short_description}` : ''}`);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedProductImage = selectedProduct?.enhanced_image_url || selectedProduct?.image_url || null;

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleGenerate = async () => {
    if (!productInfo.trim()) {
      toast({
        title: "Add product details",
        description: "Please describe your product or select one from your catalog",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Select platforms",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const productImageUrl = selectedProductImage;

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          type: 'campaign',
          productInfo,
          goal: selectedGoal,
          platforms: selectedPlatforms,
          productImageUrl,
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      setGeneratedImages(data.images || []);
      toast({
        title: "Campaign created! 🎉",
        description: `Your marketing content ${data.images?.length ? 'and images are' : 'is'} ready`,
      });

    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Marketing Campaign</h1>
            <p className="text-muted-foreground">
              Generate engaging social media content for your product
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>
                  Select from your catalog or describe any product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Selection - Optional */}
                <div>
                  <Label className="mb-2 block">
                    <Package className="w-4 h-4 inline mr-2" />
                    Select from Catalog (Optional)
                  </Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={handleProductSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Choose a product or type below"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Don't use existing product --</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            {(product.enhanced_image_url || product.image_url) && (
                              <img 
                                src={product.enhanced_image_url || product.image_url || ''} 
                                alt="" 
                                className="w-6 h-6 rounded object-cover"
                              />
                            )}
                            <span>{product.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {products.length === 0 && !isLoadingProducts && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No products in catalog yet. You can still create campaigns by describing your product below.
                    </p>
                  )}

                  {/* Selected product preview */}
                  {selectedProduct && selectedProductImage && (
                    <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border">
                      <img 
                        src={selectedProductImage} 
                        alt={selectedProduct.title} 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{selectedProduct.title}</p>
                        {selectedProduct.short_description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{selectedProduct.short_description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {selectedProductId && selectedProductId !== "none" ? "Edit product info" : "Or describe your product"}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="product-info">Product Information</Label>
                  <Textarea
                    id="product-info"
                    placeholder="E.g., Handmade leather wallet, premium quality, perfect gift..."
                    value={productInfo}
                    onChange={(e) => setProductInfo(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Campaign Goal</Label>
                  <RadioGroup value={selectedGoal} onValueChange={setSelectedGoal}>
                    <div className="grid grid-cols-2 gap-3">
                      {GOALS.map((goal) => (
                        <div key={goal.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={goal.id} id={goal.id} />
                          <Label htmlFor={goal.id} className="cursor-pointer">
                            {goal.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="mb-3 block">Select Platforms</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map((platform) => (
                      <div key={platform.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={platform.id}
                          checked={selectedPlatforms.includes(platform.id)}
                          onCheckedChange={() => handlePlatformToggle(platform.id)}
                        />
                        <Label htmlFor={platform.id} className="cursor-pointer">
                          {platform.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Campaign
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {generatedContent && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Your Campaign Content 🎉</CardTitle>
                  <CardDescription>Copy and use this content for your marketing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Generated Images */}
                  {generatedImages.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Campaign Creatives</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={imageUrl} 
                              alt={`Campaign creative ${index + 1}`}
                              className="w-full rounded-lg shadow-card hover:shadow-soft transition-all"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = imageUrl;
                                  link.download = `campaign-image-${index + 1}.png`;
                                  link.click();
                                  toast({
                                    title: "Download started",
                                    description: "Your image is being downloaded",
                                  });
                                }}
                              >
                                Download Image
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-semibold">Campaign Caption</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.caption)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-line">{generatedContent.caption}</p>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-2 block">Hashtags</Label>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags?.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium cursor-pointer"
                          onClick={() => copyToClipboard(`#${tag}`)}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {generatedContent.whatsapp_message && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-base font-semibold">WhatsApp Message</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.whatsapp_message)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground">{generatedContent.whatsapp_message}</p>
                    </div>
                  )}

                  {generatedContent.slogan && (
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Campaign Slogan</Label>
                      <p className="text-lg font-medium text-primary">{generatedContent.slogan}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => navigate("/dashboard")} className="flex-1" size="lg">
                      Back to Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedContent(null)}
                      className="flex-1"
                      size="lg"
                    >
                      Generate Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
