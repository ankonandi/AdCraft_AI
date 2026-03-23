import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, Layers, Copy, Trash2, ExternalLink } from "lucide-react";
import { CreateProductLinkModal } from "@/components/CreateProductLinkModal";
import { QuickAddProductModal } from "@/components/QuickAddProductModal";
import { EditProductModal } from "@/components/EditProductModal";
import { CreateCollectionModal } from "@/components/CreateCollectionModal";
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

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
  product_count: number;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState<CatalogProduct | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

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

  const fetchCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('product_collections')
        .select('id, name, slug, description, is_active, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get product counts
      const collectionsWithCounts: Collection[] = [];
      for (const coll of data || []) {
        const { count } = await supabase
          .from('collection_products')
          .select('id', { count: 'exact', head: true })
          .eq('collection_id', coll.id);
        collectionsWithCounts.push({ ...coll, product_count: count || 0 });
      }
      setCollections(collectionsWithCounts);
    } catch (error: any) {
      console.error('Error loading collections:', error);
    }
  };

  useEffect(() => {
    fetchCatalogProducts();
    fetchCollections();
  }, []);

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

  const handleDeleteCollection = async (id: string) => {
    try {
      const { error } = await supabase.from('product_collections').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Collection deleted" });
      fetchCollections();
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  const handleProductCreated = () => {
    fetchCatalogProducts();
    fetchCollections();
    refetch();
  };

  const copyCollectionLink = (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Collection link copied!" });
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
            <div className="flex gap-2">
              <Button variant="outline" size="lg" onClick={() => setShowCollectionModal(true)}>
                <Layers className="w-4 h-4 mr-2" />
                Create Collection
              </Button>
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
          </div>

          {/* Collections Section */}
          {collections.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Collections</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map((coll) => (
                  <Card key={coll.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{coll.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {coll.product_count} product{coll.product_count !== 1 ? 's' : ''}
                        </p>
                        {coll.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{coll.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="icon" onClick={() => copyCollectionLink(coll.slug)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => window.open(`/c/${coll.slug}`, '_blank')}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCollection(coll.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
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
                  onEdit={(p) => {
                    setEditProduct(p as CatalogProduct);
                    setShowEditModal(true);
                  }}
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

      <EditProductModal
        product={editProduct}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onProductUpdated={handleProductCreated}
      />

      <CreateCollectionModal
        open={showCollectionModal}
        onOpenChange={setShowCollectionModal}
        onCollectionCreated={handleProductCreated}
      />
    </div>
  );
}
