import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Sparkles, Save, Copy } from "lucide-react";

export default function GenerateDescription() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [productNote, setProductNote] = useState("");
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const handleGenerate = async () => {
    if (!productNote.trim()) {
      toast({
        title: "Add product details",
        description: "Please describe your product first",
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
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      toast({
        title: "Content generated! ✨",
        description: "Your product description is ready",
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

  const handleSave = async () => {
    if (!generatedContent) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('products').insert({
        user_id: user.id,
        title: generatedContent.title,
        short_description: generatedContent.short_description,
        long_description: generatedContent.long_description,
        category: generatedContent.category,
        tags: generatedContent.tags,
      });

      if (error) throw error;

      toast({
        title: "Product saved!",
        description: "Added to your catalog",
      });

      navigate("/catalog");

    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
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
            <h1 className="text-3xl font-bold mb-2">Generate Product Description</h1>
            <p className="text-muted-foreground">
              Describe your product and let AI create compelling content
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>Tell us about your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-note">Product Description</Label>
                  <Textarea
                    id="product-note"
                    placeholder="E.g., Handmade ceramic coffee mug with blue glaze, perfect for morning coffee..."
                    value={productNote}
                    onChange={(e) => setProductNote(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
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
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {generatedContent && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Generated Content ✨</CardTitle>
                  <CardDescription>Review and save your product description</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-semibold">Title</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.title)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-lg font-medium">{generatedContent.title}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-semibold">Short Description</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.short_description)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{generatedContent.short_description}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-semibold">Full Description</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.long_description)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-line">{generatedContent.long_description}</p>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-2 block">Category</Label>
                    <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                      {generatedContent.category}
                    </span>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-2 block">Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.tags?.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSave} className="flex-1" size="lg">
                      <Save className="w-4 h-4 mr-2" />
                      Save to Catalog
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/generate/campaign")}
                      className="flex-1"
                      size="lg"
                    >
                      Create Campaign
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
