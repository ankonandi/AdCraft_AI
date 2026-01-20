import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Instagram, ExternalLink, Globe } from "lucide-react";

interface ProductLinkData {
  id: string;
  slug: string;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  marketplace_url: string | null;
  website_url: string | null;
  products: {
    id: string;
    title: string;
    short_description: string | null;
    long_description: string | null;
    image_url: string | null;
    enhanced_image_url: string | null;
    category: string | null;
    tags: string[] | null;
  } | null;
}

export default function ProductLink() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [productLink, setProductLink] = useState<ProductLinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProductLink();
    }
  }, [slug]);

  const fetchProductLink = async () => {
    try {
      const { data, error } = await supabase
        .from('product_links')
        .select(`
          id,
          slug,
          whatsapp_number,
          instagram_handle,
          marketplace_url,
          website_url,
          products (
            id,
            title,
            short_description,
            long_description,
            image_url,
            enhanced_image_url,
            category,
            tags
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setError("Product not found");
        return;
      }

      setProductLink(data as unknown as ProductLinkData);

      // Track the visit with UTM params
      const utmSource = searchParams.get('utm_source');
      const utmMedium = searchParams.get('utm_medium');
      const utmCampaign = searchParams.get('utm_campaign');

      await supabase.functions.invoke('track-click', {
        body: {
          productLinkId: data.id,
          utmSource,
          utmMedium,
          utmCampaign,
          referrer: document.referrer,
          source: utmSource || 'direct'
        }
      });

    } catch (err: any) {
      console.error('Error fetching product link:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const trackButtonClick = async (source: string) => {
    if (!productLink) return;
    
    await supabase.functions.invoke('track-click', {
      body: {
        productLinkId: productLink.id,
        source,
        referrer: document.referrer
      }
    });
  };

  const handleWhatsAppClick = () => {
    if (!productLink?.whatsapp_number || !productLink.products) return;
    trackButtonClick('whatsapp');
    const message = encodeURIComponent(`Hi! I'm interested in: ${productLink.products.title}`);
    window.open(`https://wa.me/${productLink.whatsapp_number}?text=${message}`, '_blank');
  };

  const handleInstagramClick = () => {
    if (!productLink?.instagram_handle) return;
    trackButtonClick('instagram');
    window.open(`https://instagram.com/${productLink.instagram_handle}`, '_blank');
  };

  const handleMarketplaceClick = () => {
    if (!productLink?.marketplace_url) return;
    trackButtonClick('marketplace');
    window.open(productLink.marketplace_url, '_blank');
  };

  const handleWebsiteClick = () => {
    if (!productLink?.website_url) return;
    trackButtonClick('website');
    window.open(productLink.website_url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !productLink || !productLink.products) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
            <p className="text-muted-foreground">
              This product link may have been removed or is no longer available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const product = productLink.products;
  const displayImage = product.enhanced_image_url || product.image_url;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-lg mx-auto pt-8 pb-12">
        {/* Product Card */}
        <Card className="overflow-hidden mb-6 shadow-soft">
          {displayImage && (
            <div className="aspect-square overflow-hidden bg-secondary">
              <img 
                src={displayImage} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-6">
            {product.category && (
              <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs mb-3">
                {product.category}
              </span>
            )}
            <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
            {product.short_description && (
              <p className="text-muted-foreground mb-4">{product.short_description}</p>
            )}
            {product.long_description && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {product.long_description}
              </p>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-accent/50 text-accent-foreground rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {productLink.whatsapp_number && (
            <Button 
              onClick={handleWhatsAppClick}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat on WhatsApp
            </Button>
          )}

          {productLink.instagram_handle && (
            <Button 
              onClick={handleInstagramClick}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              size="lg"
            >
              <Instagram className="w-5 h-5 mr-2" />
              View on Instagram
            </Button>
          )}

          {productLink.marketplace_url && (
            <Button 
              onClick={handleMarketplaceClick}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Buy on Marketplace
            </Button>
          )}

          {productLink.website_url && (
            <Button 
              onClick={handleWebsiteClick}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Globe className="w-5 h-5 mr-2" />
              Visit Website
            </Button>
          )}
        </div>

        {/* Footer Branding */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by AdCraft AI
        </p>
      </div>
    </div>
  );
}
