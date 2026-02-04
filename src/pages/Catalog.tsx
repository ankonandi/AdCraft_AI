import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink, Plus, Link2, BarChart3, Copy, Check, Sparkles } from "lucide-react";
import { CreateProductLinkModal } from "@/components/CreateProductLinkModal";
import { ProductAnalytics } from "@/components/ProductAnalytics";
import { QuickAddProductModal } from "@/components/QuickAddProductModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
interface ProductLink {
  id: string;
  slug: string;
}

interface Product {
  id: string;
  title: string;
  short_description: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  enhanced_image_url: string | null;
  product_links: ProductLink[];
}

export default function Catalog() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          short_description,
          category,
          tags,
          image_url,
          enhanced_image_url,
          product_links (id, slug)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data as unknown as Product[]) || []);
    } catch (error: any) {
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Product deleted",
        description: "Product removed from catalog",
      });

      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyProductLink = (slug: string) => {
    const link = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(slug);
    setTimeout(() => setCopiedLink(null), 2000);
    toast({
      title: "Link copied!",
      description: "Share it on WhatsApp, Instagram, or anywhere",
    });
  };

  const openCreateLinkModal = (product: Product) => {
    setSelectedProduct(product);
    setShowLinkModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Product Catalog</h1>
              <p className="text-muted-foreground">
                Manage your products and shareable links
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowQuickAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Add
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/generate/description")}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Description
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No products yet</p>
                <Button onClick={() => navigate("/generate/description")}>
                  Create Your First Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-soft transition-all overflow-hidden">
                  {/* Product Image */}
                  {(product.enhanced_image_url || product.image_url) && (
                    <div className="aspect-video overflow-hidden bg-secondary">
                      <img 
                        src={product.enhanced_image_url || product.image_url || ''} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{product.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.short_description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {product.category && (
                      <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                        {product.category}
                      </span>
                    )}

                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {product.tags.slice(0, 3).map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-accent/50 text-accent-foreground rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {product.tags.length > 3 && (
                          <span className="px-2 py-1 text-muted-foreground text-xs">
                            +{product.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Product Link Section */}
                    {product.product_links && product.product_links.length > 0 ? (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Shareable Link</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyProductLink(product.product_links[0].slug)}
                          >
                            {copiedLink === product.product_links[0].slug ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowAnalytics(
                            showAnalytics === product.product_links[0].id 
                              ? null 
                              : product.product_links[0].id
                          )}
                        >
                          <BarChart3 className="w-3 h-3 mr-1" />
                          {showAnalytics === product.product_links[0].id ? 'Hide' : 'View'} Analytics
                        </Button>
                        
                        {showAnalytics === product.product_links[0].id && (
                          <ProductAnalytics productLinkId={product.product_links[0].id} />
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => openCreateLinkModal(product)}
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        Create Shareable Link
                      </Button>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate("/generate/campaign")}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Create Campaign
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedProduct && (
        <CreateProductLinkModal
          productId={selectedProduct.id}
          productTitle={selectedProduct.title}
          open={showLinkModal}
          onOpenChange={setShowLinkModal}
          onLinkCreated={fetchProducts}
        />
      )}

      <QuickAddProductModal
        open={showQuickAddModal}
        onOpenChange={setShowQuickAddModal}
        onProductCreated={fetchProducts}
      />
    </div>
  );
}
