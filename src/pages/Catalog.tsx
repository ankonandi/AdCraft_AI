import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink, Plus } from "lucide-react";

export default function Catalog() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Product Catalog</h1>
              <p className="text-muted-foreground">
                Manage your saved product listings
              </p>
            </div>
            <Button onClick={() => navigate("/generate/description")} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
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
                <Card key={product.id} className="hover:shadow-soft transition-all">
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
    </div>
  );
}
