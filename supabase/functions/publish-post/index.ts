import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  postId: string;
  platform: string;
}

interface PublishResult {
  platform: string;
  success: boolean;
  platformPostId?: string;
  error?: string;
  publishedAt?: string;
}

async function getUserCredential(supabase: any, userId: string, platform: string, key: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_social_credentials')
    .select('credential_value')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('credential_key', key)
    .single();
  return data?.credential_value || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // User-scoped client for auth check
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Service role client to read credentials (bypasses RLS for the edge function context)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { postId, platform }: PublishRequest = await req.json();

    if (!postId || !platform) {
      return new Response(JSON.stringify({ error: 'postId and platform are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch the post (use user client to respect RLS)
    const { data: post, error: postError } = await supabaseUser
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Helper to get user's credentials from DB
    const getCred = (credPlatform: string, key: string) => getUserCredential(supabaseAdmin, user.id, credPlatform, key);

    let result: PublishResult;

    if (platform === 'instagram') {
      result = await publishToInstagram(post, getCred);
    } else if (platform === 'facebook') {
      result = await publishToFacebook(post, getCred);
    } else if (platform === 'whatsapp') {
      result = await publishToWhatsApp(post, getCred);
    } else {
      return new Response(JSON.stringify({ error: `Unsupported platform: ${platform}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update publish_results
    const existingResults = (post.publish_results as Record<string, unknown>) || {};
    const updatedResults = { ...existingResults, [platform]: result };

    const allPlatforms = post.platforms as string[];
    const allPublished = allPlatforms.every((p: string) => {
      const r = updatedResults[p] as PublishResult | undefined;
      return r?.success === true;
    });

    const updateData: Record<string, unknown> = { publish_results: updatedResults };

    if (allPublished) {
      updateData.status = 'published';
      updateData.published_at = new Date().toISOString();
    } else if (result.success) {
      updateData.status = 'published';
      if (!post.published_at) updateData.published_at = new Date().toISOString();
    }

    await supabaseUser
      .from('scheduled_posts')
      .update(updateData)
      .eq('id', postId);

    if (result.success) {
      await supabaseUser.from('post_analytics').insert({
        post_id: postId,
        metric_type: 'publish',
        metric_value: 1,
        metadata: { platform, platformPostId: result.platformPostId },
      });
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Publish error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

type GetCred = (platform: string, key: string) => Promise<string | null>;

async function publishToInstagram(post: any, getCred: GetCred): Promise<PublishResult> {
  const accessToken = await getCred('meta', 'page_access_token');
  const igAccountId = await getCred('meta', 'instagram_business_account_id');

  if (!accessToken || !igAccountId) {
    return {
      platform: 'instagram',
      success: false,
      error: 'Instagram credentials not configured. Go to Social Settings → API Settings to add your Meta API keys.',
    };
  }

  try {
    const caption = buildCaption(post);
    const imageUrl = post.image_urls?.[0];

    if (!imageUrl) {
      return { platform: 'instagram', success: false, error: 'Instagram requires at least one image.' };
    }

    const createRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    });

    const createData = await createRes.json();
    if (createData.error) return { platform: 'instagram', success: false, error: createData.error.message };

    const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: createData.id, access_token: accessToken }),
    });

    const publishData = await publishRes.json();
    if (publishData.error) return { platform: 'instagram', success: false, error: publishData.error.message };

    return { platform: 'instagram', success: true, platformPostId: publishData.id, publishedAt: new Date().toISOString() };
  } catch (err) {
    return { platform: 'instagram', success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

async function publishToFacebook(post: any, getCred: GetCred): Promise<PublishResult> {
  const accessToken = await getCred('meta', 'page_access_token');
  const pageId = await getCred('meta', 'facebook_page_id');

  if (!accessToken || !pageId) {
    return {
      platform: 'facebook',
      success: false,
      error: 'Facebook credentials not configured. Go to Social Settings → API Settings to add your Meta API keys.',
    };
  }

  try {
    const message = buildCaption(post);
    const imageUrl = post.image_urls?.[0];

    let endpoint: string;
    let body: Record<string, string>;

    if (imageUrl) {
      endpoint = `https://graph.facebook.com/v21.0/${pageId}/photos`;
      body = { url: imageUrl, message, access_token: accessToken };
    } else {
      endpoint = `https://graph.facebook.com/v21.0/${pageId}/feed`;
      body = { message, access_token: accessToken };
      if (post.link_url) body.link = post.link_url;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.error) return { platform: 'facebook', success: false, error: data.error.message };

    return { platform: 'facebook', success: true, platformPostId: data.id || data.post_id, publishedAt: new Date().toISOString() };
  } catch (err) {
    return { platform: 'facebook', success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

async function publishToWhatsApp(post: any, getCred: GetCred): Promise<PublishResult> {
  const accessToken = await getCred('whatsapp', 'access_token');
  const phoneNumberId = await getCred('whatsapp', 'phone_number_id');

  if (!accessToken || !phoneNumberId) {
    return {
      platform: 'whatsapp',
      success: false,
      error: 'WhatsApp credentials not configured. Go to Social Settings → API Settings to add your WhatsApp API keys.',
    };
  }

  try {
    const message = buildCaption(post);

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', type: 'text', text: { body: message } }),
    });

    const data = await res.json();
    if (data.error) return { platform: 'whatsapp', success: false, error: data.error.message };

    return { platform: 'whatsapp', success: true, platformPostId: data.messages?.[0]?.id, publishedAt: new Date().toISOString() };
  } catch (err) {
    return { platform: 'whatsapp', success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function buildCaption(post: any): string {
  let caption = post.caption || '';
  if (post.hashtags?.length > 0) caption += '\n\n' + post.hashtags.map((h: string) => `#${h}`).join(' ');
  if (post.link_url) caption += '\n\n🔗 ' + post.link_url;
  return caption;
}
