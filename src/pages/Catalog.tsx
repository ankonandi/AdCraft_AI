import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles } from "lucide-react";
import { CreateProductLinkModal } from "@/components/CreateProductLinkModal";
import { QuickAddProductModal } from "@/components/QuickAddProductModal";
import { EditProductModal } from "@/components/EditProductModal";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
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

interface CatalogProduct {
  id: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  enhanced_image_url: string | null;
  created_at: string | null;
  product_links: ProductLink[];
}

export default function Catalog() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products: baseProducts, isLoading, refetch } = useProducts();
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // Fetch products with links (catalog-specific)
  const fetchCatalogProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data, error } = await supabase
        .from('products')
        .select(`id, title, short_description, long_description, category, tags, image_url, enhanced_image_url, created_at, product_links (id, slug)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCatalogProducts((data as unknown as CatalogProduct[]) || []);
    } catch (error: any) {
      toast({ title: "Error loading products", description: error.message, variant: "destructive" });
    } finally {
      setIsCatalogLoading(false);
    }
  };

  useEffect(() => { fetchCatalogProducts(); }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Product deleted", description: "Product removed from catalog" });
      fetchCatalogProducts();
      refetch();
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  const handleProductCreated = () => {
    fetchCatalogProducts();
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Product Library</h1>
              <p className="text-muted-foreground">
                Your unified product library — use any product across the app
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

          {isCatalogLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : catalogProducts.length === 0 ? (
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
              {catalogProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  onCreateLink={(p) => {
                    setSelectedProduct(p as CatalogProduct);
                    setShowLinkModal(true);
                  }}
                />
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
          onLinkCreated={handleProductCreated}
        />
      )}

      <QuickAddProductModal
        open={showQuickAddModal}
        onOpenChange={setShowQuickAddModal}
        onProductCreated={handleProductCreated}
      />
    </div>
  );
}
