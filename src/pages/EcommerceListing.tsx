import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { ProductSelector } from "@/components/ProductSelector";
import { useProducts } from "@/hooks/useProducts";
import { Sparkles, Copy, Download, ShoppingBag, Loader2, ArrowLeft, PackageSearch } from "lucide-react";

const PLATFORMS = [
  { id: "amazon", label: "Amazon India", color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "flipkart", label: "Flipkart", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "meesho", label: "Meesho", color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
];

type Listings = Record<string, Record<string, string | string[]>>;

function csvEscape(value: string) {
  const v = value.replace(/"/g, '""');
  return /[",\n]/.test(v) ? `"${v}"` : v;
}

function downloadCsv(platform: string, fields: string[], data: Record<string, string | string[]>) {
  const headers = fields.join(",");
  const row = fields
    .map((f) => {
      const v = data[f];
      if (Array.isArray(v)) return csvEscape(v.join(" | "));
      return csvEscape(String(v ?? ""));
    })
    .join(",");
  const blob = new Blob([headers + "\n" + row], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${platform}-listing-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EcommerceListing() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { products, isLoading: productsLoading, getProductImage } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>("none");
  const [images, setImages] = useState<{ original: string; enhanced: string | null }[]>([]);
  const [imageKey, setImageKey] = useState(0);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [brandName, setBrandName] = useState("");
  const [productInfo, setProductInfo] = useState("");
  const [features, setFeatures] = useState("");
  const [selected, setSelected] = useState<string[]>(["amazon", "flipkart", "meesho"]);
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<Listings | null>(null);
  const [fields, setFields] = useState<Record<string, string[]>>({});

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    if (id === "none") return;
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const originals = (p.image_urls && p.image_urls.length > 0)
      ? p.image_urls
      : (p.image_url ? [p.image_url] : []);
    const enhanced = (p.enhanced_image_urls && p.enhanced_image_urls.length > 0)
      ? p.enhanced_image_urls
      : (p.enhanced_image_url ? [p.enhanced_image_url] : []);
    const imgs = originals.map((o, i) => ({ original: o, enhanced: enhanced[i] || null }));
    setImages(imgs);
    setPrimaryIndex(0);
    setImageKey((k) => k + 1);
    const info = [p.title, p.long_description || p.short_description].filter(Boolean).join("\n\n");
    if (info) setProductInfo(info);
    const feat = [
      p.category ? `Category: ${p.category}` : "",
      p.tags && p.tags.length ? `Tags: ${p.tags.join(", ")}` : "",
    ].filter(Boolean).join("\n");
    if (feat) setFeatures(feat);
    toast({ title: `Loaded "${p.title}" from your catalog` });
  };

  const togglePlatform = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const primaryImage = images[primaryIndex]
    ? images[primaryIndex].enhanced || images[primaryIndex].original
    : null;

  const handleGenerate = async () => {
    if (!brandName.trim()) {
      toast({ title: "Brand name required", description: "Tell us your brand name", variant: "destructive" });
      return;
    }
    if (!productInfo.trim() || !features.trim()) {
      toast({ title: "Missing info", description: "Add detailed description and key features", variant: "destructive" });
      return;
    }
    if (selected.length === 0) {
      toast({ title: "Pick at least one platform", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ecommerce-listing", {
        body: {
          platforms: selected,
          brandName: brandName.trim(),
          productInfo,
          features,
          productImageUrl: primaryImage,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setListings(data.listings);
      setFields(data.fields);
      toast({ title: "Listings generated ✨" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAll = (platform: string) => {
    const data = listings?.[platform];
    if (!data) return;
    const text = Object.entries(data)
      .map(([k, v]) => `${k.toUpperCase()}\n${Array.isArray(v) ? v.map((x) => `• ${x}`).join("\n") : v}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: `${platform} listing copied` });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-7 h-7 text-primary" /> Post to Ecommerce
              </h1>
              <p className="text-muted-foreground">
                Upload photos, describe your product, and get SEO-optimized listings + CSV exports for each marketplace.
              </p>
            </div>
          </div>

          {/* Step 0: Pick from catalog */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageSearch className="w-5 h-5 text-primary" /> Use a product from your catalog
              </CardTitle>
              <CardDescription>Optional — pre-fills photos and description from your library.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductSelector
                products={products}
                isLoading={productsLoading}
                value={selectedProductId}
                onValueChange={handleSelectProduct}
                placeholder="Choose a product (or upload fresh below)"
                getProductImage={getProductImage}
              />
            </CardContent>
          </Card>

          {/* Step 1: Images */}
          <Card>
            <CardHeader>
              <CardTitle>1. Product Photos</CardTitle>
              <CardDescription>Upload multiple images. Enhance any/all — pick the best one as Primary.</CardDescription>
            </CardHeader>
            <CardContent>
              <MultiImageUploader
                key={imageKey}
                initialImages={images}
                onChange={(imgs, primary) => {
                  setImages(imgs);
                  setPrimaryIndex(primary);
                }}
              />
            </CardContent>
          </Card>

          {/* Step 2: Details */}
          <Card>
            <CardHeader>
              <CardTitle>2. Product Details</CardTitle>
              <CardDescription>The more detail, the better the SEO listing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand name <span className="text-destructive">*</span></Label>
                <Input
                  id="brand"
                  placeholder="E.g., Mitti & Co."
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value.slice(0, 80))}
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="info">Detailed description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="info"
                  rows={4}
                  placeholder="E.g., Handmade vegetable-tanned leather bifold wallet, full-grain Italian leather, 8 card slots, 2 cash compartments, RFID-blocking…"
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="features">Key features & specs <span className="text-destructive">*</span></Label>
                <Textarea
                  id="features"
                  rows={4}
                  placeholder="Brand: ___, Material: ___, Color: ___, Size: ___, Country of origin: India, Care instructions: ___, Warranty: ___"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Platforms */}
          <Card>
            <CardHeader>
              <CardTitle>3. Choose Marketplaces</CardTitle>
              <CardDescription>Pick one or many — each gets a tailored listing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3">
                {PLATFORMS.map((p) => {
                  const checked = selected.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition ${
                        checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => togglePlatform(p.id)} />
                      <span className={`font-medium ${p.color} px-2 py-0.5 rounded-md text-sm`}>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating SEO listings…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate Listings</>
            )}
          </Button>

          {/* Results */}
          {listings && (
            <div className="space-y-6 pt-4">
              {Object.keys(listings).map((platform) => {
                const data = listings[platform];
                const platMeta = PLATFORMS.find((x) => x.id === platform);
                return (
                  <Card key={platform}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge className={platMeta?.color}>{platMeta?.label || platform}</Badge>
                          Listing
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => copyAll(platform)}>
                          <Copy className="w-3 h-3 mr-1" /> Copy all
                        </Button>
                        <Button size="sm" onClick={() => downloadCsv(platform, fields[platform] || Object.keys(data), data)}>
                          <Download className="w-3 h-3 mr-1" /> CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                              {key.replace(/_/g, " ")}
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => {
                                navigator.clipboard.writeText(Array.isArray(value) ? value.join("\n") : String(value));
                                toast({ title: "Copied" });
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          {Array.isArray(value) ? (
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              {value.map((v, i) => <li key={i}>{v}</li>)}
                            </ul>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap rounded-md bg-muted/50 p-3">{value}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
