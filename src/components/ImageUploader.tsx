import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Sparkles, Check, Loader2, X } from "lucide-react";

interface ImageUploaderProps {
  onImageReady: (originalImage: string, enhancedImage: string | null) => void;
  className?: string;
}

export function ImageUploader({ onImageReady, className = "" }: ImageUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setOriginalImage(base64);
      setEnhancedImage(null);
      setIsEnhanced(false);
    };
    reader.readAsDataURL(file);
  };

  const handleEnhance = async () => {
    if (!originalImage) return;

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-image', {
        body: { 
          imageData: originalImage,
          customPrompt: customPrompt.trim() || undefined,
        }
      });

      if (error) throw error;

      if (data.enhancedImage) {
        setEnhancedImage(data.enhancedImage);
        setIsEnhanced(true);
        toast({
          title: "Image enhanced! ✨",
          description: "Your product photo has been professionally enhanced",
        });
        onImageReady(originalImage, data.enhancedImage);
      }
    } catch (error: any) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement failed",
        description: error.message || "Could not enhance image. Using original instead.",
        variant: "destructive",
      });
      onImageReady(originalImage, null);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSkipEnhancement = () => {
    if (originalImage) {
      onImageReady(originalImage, null);
    }
  };

  const clearImage = () => {
    setOriginalImage(null);
    setEnhancedImage(null);
    setIsEnhanced(false);
    setCustomPrompt("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!originalImage ? (
        <Card 
          className="border-2 border-dashed border-primary/30 hover:border-primary/50 cursor-pointer transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="w-12 h-12 text-primary/50 mb-4" />
            <p className="text-lg font-medium mb-1">Upload Product Photo</p>
            <p className="text-sm text-muted-foreground">
              Click to upload JPEG, PNG, or WebP
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
                onClick={clearImage}
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Original</p>
                  <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
                    <img 
                      src={originalImage} 
                      alt="Original product" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {isEnhanced ? "Enhanced ✨" : "Enhanced Preview"}
                  </p>
                  <div className="aspect-square overflow-hidden rounded-lg bg-secondary flex items-center justify-center">
                    {enhancedImage ? (
                      <img 
                        src={enhancedImage} 
                        alt="Enhanced product" 
                        className="w-full h-full object-cover"
                      />
                    ) : isEnhancing ? (
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Enhancing...</p>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click enhance to improve lighting & clarity
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Enhancement Prompt */}
              {!isEnhanced && (
                <div className="mt-4">
                  <Input
                    placeholder="Optional: e.g., make background white, brighten colors, remove shadows..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    disabled={isEnhancing}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for default enhancement, or describe how you'd like it improved
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                {!isEnhanced && (
                  <>
                    <Button
                      onClick={handleEnhance}
                      disabled={isEnhancing}
                      className="flex-1"
                    >
                      {isEnhancing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Enhance Image
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSkipEnhancement}
                      disabled={isEnhancing}
                    >
                      Skip
                    </Button>
                  </>
                )}
                {isEnhanced && (
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Different Photo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
