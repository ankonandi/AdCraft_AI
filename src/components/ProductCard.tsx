import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, ExternalLink, Plus, Link2, BarChart3, Copy, Check, ChevronDown, ChevronUp, Pencil, Send } from "lucide-react";
import { CreateProductLinkModal } from "@/components/CreateProductLinkModal";
import { ProductAnalytics } from "@/components/ProductAnalytics";
import { type Product } from "@/hooks/useProducts";

interface ProductLink {
  id: string;
  slug: string;
}

interface ProductWithLinks extends Product {
  product_links: ProductLink[];
}

interface ProductCardProps {
  product: ProductWithLinks;
  onDelete: (id: string) => void;
  onEdit: (product: ProductWithLinks) => void;
  onCreateLink: (product: ProductWithLinks) => void;
}

export function ProductCard({ product, onDelete, onEdit, onCreateLink }: ProductCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const displayImage = product.enhanced_image_url || product.image_url;

  const copyProductLink = (slug: string) => {
    const link = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(slug);
    setTimeout(() => setCopiedLink(null), 2000);
    toast({ title: "Link copied!", description: "Share it on WhatsApp, Instagram, or anywhere" });
  };

  return (
    <Card className="hover:shadow-soft transition-all overflow-hidden">
      {displayImage && (
        <div className="aspect-video overflow-hidden bg-secondary">
          <img src={displayImage} alt={product.title} className="w-full h-full object-cover" />
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-lg">{product.title}</CardTitle>
        <CardDescription className="line-clamp-2">{product.short_description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {product.category && (
          <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
            {product.category}
          </span>
        )}

        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-accent/50 text-accent-foreground rounded text-xs">
                #{tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="px-2 py-0.5 text-muted-foreground text-xs">+{product.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Expandable details */}
        {product.long_description && (
          <div>
            <Button variant="ghost" size="sm" className="px-0 h-auto text-xs text-muted-foreground" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              {expanded ? "Less details" : "More details"}
            </Button>
            {expanded && (
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{product.long_description}</p>
            )}
          </div>
        )}

        {/* Product Link Section */}
        {product.product_links?.length > 0 ? (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Shareable Link</p>
              <Button variant="ghost" size="sm" onClick={() => copyProductLink(product.product_links[0].slug)}>
                {copiedLink === product.product_links[0].slug ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <Button
              variant="outline" size="sm" className="w-full"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              {showAnalytics ? "Hide" : "View"} Analytics
            </Button>
            {showAnalytics && <ProductAnalytics productLinkId={product.product_links[0].id} />}
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => onCreateLink(product)}>
            <Link2 className="w-3 h-3 mr-1" />
            Create Shareable Link
          </Button>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(product)}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/social/schedule", {
            state: {
              productId: product.id,
              productTitle: product.title,
              productDescription: product.short_description,
              productImage: product.enhanced_image_url || product.image_url,
              prefillCaption: `${product.title}${product.short_description ? `\n\n${product.short_description}` : ''}`,
              prefillHashtags: product.tags?.map(t => `#${t}`).join(' ') || '',
              linkType: 'product',
            }
          })}>
            <Send className="w-3 h-3 mr-1" />
            Create Post
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(product.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
