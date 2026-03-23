

## Plan: Multi-Product Storefront Links (Product Groups/Clusters)

### What We're Building
A "storefront" or "collection" link feature where platform users (business owners) can group multiple products into a single shareable link. End customers visiting this link see a tile grid of products and can tap any tile to view full product details — all within one page.

### New Concepts
- **Product Collection**: A group/cluster containing multiple products, with its own slug, name, and shared contact info (WhatsApp, Instagram, etc.)
- **Collection Link Page** (`/c/:slug`): A public-facing storefront showing product tiles; clicking a tile expands to show full product details

### Database Changes

**New table: `product_collections`**
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `name` (text, NOT NULL) — e.g. "My Handmade Jewelry"
- `slug` (text, UNIQUE, NOT NULL)
- `description` (text, nullable)
- `whatsapp_number`, `instagram_handle`, `marketplace_url`, `website_url` (text, nullable)
- `is_active` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

**New table: `collection_products`** (junction)
- `id` (uuid, PK)
- `collection_id` (uuid, FK → product_collections)
- `product_id` (uuid, FK → products)
- `sort_order` (integer, default 0)
- UNIQUE(collection_id, product_id)

**RLS**: Owner CRUD on both tables; public SELECT on active collections and their products.

### Frontend Changes

1. **New page: `src/pages/CollectionLink.tsx`** — Public storefront at `/c/:slug`
   - Fetches collection + joined products
   - Shows collection name/description at top
   - Renders products as image tiles in a responsive grid
   - Clicking a tile opens an expanded view (inline accordion or modal) showing full product details (image, title, descriptions, tags)
   - Shared contact buttons (WhatsApp, Instagram, etc.) at bottom
   - Click tracking per collection visit
   - Mobile-first, branded "Powered by AdCraft AI" footer

2. **New component: `src/components/CreateCollectionModal.tsx`**
   - Name, description fields
   - Multi-select product picker (from existing library)
   - Drag-to-reorder or simple sort
   - WhatsApp/Instagram/marketplace/website fields
   - Generates slug and creates collection

3. **Update `src/pages/Catalog.tsx`**
   - Add "Create Collection Link" button alongside existing "Add Product"
   - Show existing collections in a separate section below products
   - Each collection card shows name, product count, copy link, delete

4. **Update `src/App.tsx`**
   - Add route `/c/:slug` → `CollectionLink`

5. **Existing single product links (`/p/:slug`)** remain unchanged — collections are additive.

### Customer-Facing Storefront Design
```text
┌─────────────────────────────┐
│   [Collection Name]         │
│   [Description]             │
├──────────┬──────────────────┤
│ ┌──────┐ │ ┌──────┐        │
│ │ img  │ │ │ img  │        │
│ │      │ │ │      │        │
│ │Title │ │ │Title │        │
│ └──────┘ │ └──────┘        │
├──────────┴──────────────────┤
│ [Chat on WhatsApp]          │
│ [View on Instagram]         │
│ Powered by AdCraft AI       │
└─────────────────────────────┘

On tile click → expands to full product view
```

### Implementation Order
1. Database migration (2 tables + RLS)
2. Collection link public page (`/c/:slug`)
3. Create collection modal
4. Integrate into Catalog page
5. Add route

