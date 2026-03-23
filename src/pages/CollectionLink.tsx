import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Instagram, ExternalLink, Globe, ChevronLeft, X } from "lucide-react";

interface CollectionProduct {
  id: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  image_url: string | null;
  enhanced_image_url: string | null;
  category: string | null;
  tags: string[] | null;
}

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  marketplace_url: string | null;
  website_url: string | null;
}

export default function CollectionLink() {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CollectionProduct | null>(null);

  useEffect(() => {
    if (slug) fetchCollection();
  }, [slug]);

  const fetchCollection = async () => {
    try {
      const { data: collectionData, error: collError } = await supabase
        .from('product_collections')
        .select('id, name, slug, description, whatsapp_number, instagram_handle, marketplace_url, website_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (collError) throw collError;
      if (!collectionData) { setError("Collection not found"); return; }

      setCollection(collectionData as CollectionData);

      // Fetch products via junction table
      const { data: cpData, error: cpError } = await supabase
        .from('collection_products')
        .select('product_id, sort_order')
        .eq('collection_id', collectionData.id)
        .order('sort_order', { ascending: true });

      if (cpError) throw cpError;

      if (cpData && cpData.length > 0) {
        const productIds = cpData.map(cp => cp.product_id);
        const { data: productsData, error: pError } = await supabase
          .from('products')
          .select('id, title, short_description, long_description, image_url, enhanced_image_url, category, tags')
          .in('id', productIds);

        if (pError) throw pError;

        // Sort by the junction table order
        const orderMap = new Map(cpData.map(cp => [cp.product_id, cp.sort_order]));
        const sorted = (productsData || []).sort(
          (a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0)
        );
        setProducts(sorted);
      }
    } catch (err: any) {
      console.error('Error fetching collection:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getImage = (p: CollectionProduct) => p.enhanced_image_url || p.image_url;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Collection Not Found</h1>
            <p className="text-muted-foreground">This collection may have been removed or is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Product detail view
  if (selectedProduct) {
    const img = getImage(selectedProduct);
    return (
      <div className="min-h-screen bg-gradient-subtle p-4">
        <div className="max-w-lg mx-auto pt-4 pb-12">
          <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to collection
          </Button>

          <Card className="overflow-hidden mb-6 shadow-soft">
            {img && (
              <div className="aspect-square overflow-hidden bg-secondary">
                <img src={img} alt={selectedProduct.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className="p-6">
              {selectedProduct.category && (
                <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs mb-3">
                  {selectedProduct.category}
                </span>
              )}
              <h1 className="text-2xl font-bold mb-2">{selectedProduct.title}</h1>
              {selectedProduct.short_description && (
                <p className="text-muted-foreground mb-4">{selectedProduct.short_description}</p>
              )}
              {selectedProduct.long_description && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedProduct.long_description}</p>
              )}
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedProduct.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-accent/50 text-accent-foreground rounded text-xs">#{tag}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact buttons */}
          <div className="space-y-3">
            {collection.whatsapp_number && (
              <Button
                onClick={() => {
                  const msg = encodeURIComponent(`Hi! I'm interested in: ${selectedProduct.title}`);
                  window.open(`https://wa.me/${collection.whatsapp_number}?text=${msg}`, '_blank');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" /> Chat on WhatsApp
              </Button>
            )}
            {collection.instagram_handle && (
              <Button
                onClick={() => window.open(`https://instagram.com/${collection.instagram_handle}`, '_blank')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" size="lg"
              >
                <Instagram className="w-5 h-5 mr-2" /> View on Instagram
              </Button>
            )}
            {collection.marketplace_url && (
              <Button onClick={() => window.open(collection.marketplace_url!, '_blank')} variant="outline" className="w-full" size="lg">
                <ExternalLink className="w-5 h-5 mr-2" /> Buy on Marketplace
              </Button>
            )}
            {collection.website_url && (
              <Button onClick={() => window.open(collection.website_url!, '_blank')} variant="outline" className="w-full" size="lg">
                <Globe className="w-5 h-5 mr-2" /> Visit Website
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">Powered by AdCraft AI</p>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-2xl mx-auto pt-8 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
          {collection.description && (
            <p className="text-muted-foreground">{collection.description}</p>
          )}
        </div>

        {/* Product tiles */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No products in this collection yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => {
              const img = getImage(product);
              return (
                <Card
                  key={product.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedProduct(product)}
                >
                  {img ? (
                    <div className="aspect-square overflow-hidden bg-secondary">
                      <img src={img} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-secondary flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No image</span>
                    </div>
                  )}
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.title}</h3>
                    {product.short_description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.short_description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Contact buttons */}
        <div className="space-y-3 mt-8">
          {collection.whatsapp_number && (
            <Button
              onClick={() => {
                const msg = encodeURIComponent(`Hi! I'm interested in your products from ${collection.name}`);
                window.open(`https://wa.me/${collection.whatsapp_number}?text=${msg}`, '_blank');
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" /> Chat on WhatsApp
            </Button>
          )}
          {collection.instagram_handle && (
            <Button
              onClick={() => window.open(`https://instagram.com/${collection.instagram_handle}`, '_blank')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" size="lg"
            >
              <Instagram className="w-5 h-5 mr-2" /> View on Instagram
            </Button>
          )}
          {collection.marketplace_url && (
            <Button onClick={() => window.open(collection.marketplace_url!, '_blank')} variant="outline" className="w-full" size="lg">
              <ExternalLink className="w-5 h-5 mr-2" /> Buy on Marketplace
            </Button>
          )}
          {collection.website_url && (
            <Button onClick={() => window.open(collection.website_url!, '_blank')} variant="outline" className="w-full" size="lg">
              <Globe className="w-5 h-5 mr-2" /> Visit Website
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">Powered by AdCraft AI</p>
      </div>
    </div>
  );
}
