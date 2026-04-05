import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  postId: string;
  platform: string; // 'instagram' | 'facebook' | 'whatsapp'
}

interface PublishResult {
  platform: string;
  success: boolean;
  platformPostId?: string;
  error?: string;
  publishedAt?: string;
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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { postId, platform }: PublishRequest = await req.json();

    if (!postId || !platform) {
      return new Response(JSON.stringify({ error: 'postId and platform are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch the post
    const { data: post, error: postError } = await supabase
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

    let result: PublishResult;

    if (platform === 'instagram') {
      result = await publishToInstagram(post);
    } else if (platform === 'facebook') {
      result = await publishToFacebook(post);
    } else if (platform === 'whatsapp') {
      result = await publishToWhatsApp(post);
    } else {
      return new Response(JSON.stringify({ error: `Unsupported platform: ${platform}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update publish_results on the post
    const existingResults = (post.publish_results as Record<string, unknown>) || {};
    const updatedResults = { ...existingResults, [platform]: result };

    // Check if all platforms are done
    const allPlatforms = post.platforms as string[];
    const allPublished = allPlatforms.every((p: string) => {
      const r = updatedResults[p] as PublishResult | undefined;
      return r?.success === true;
    });

    const updateData: Record<string, unknown> = {
      publish_results: updatedResults,
    };

    if (allPublished) {
      updateData.status = 'published';
      updateData.published_at = new Date().toISOString();
    } else if (result.success) {
      // At least one published
      updateData.status = 'published';
      if (!post.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    await supabase
      .from('scheduled_posts')
      .update(updateData)
      .eq('id', postId);

    // Log analytics
    if (result.success) {
      await supabase.from('post_analytics').insert({
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

async function publishToInstagram(post: any): Promise<PublishResult> {
  const accessToken = Deno.env.get('META_PAGE_ACCESS_TOKEN');
  const igAccountId = Deno.env.get('INSTAGRAM_BUSINESS_ACCOUNT_ID');

  if (!accessToken || !igAccountId) {
    return {
      platform: 'instagram',
      success: false,
      error: 'Instagram API credentials not configured. Please add META_PAGE_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID.',
    };
  }

  try {
    const caption = buildCaption(post);
    const imageUrl = post.image_urls?.[0];

    if (!imageUrl) {
      return { platform: 'instagram', success: false, error: 'Instagram requires at least one image.' };
    }

    // Step 1: Create media container
    const createUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    });

    const createData = await createRes.json();
    if (createData.error) {
      return { platform: 'instagram', success: false, error: createData.error.message };
    }

    const creationId = createData.id;

    // Step 2: Publish
    const publishUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });

    const publishData = await publishRes.json();
    if (publishData.error) {
      return { platform: 'instagram', success: false, error: publishData.error.message };
    }

    return {
      platform: 'instagram',
      success: true,
      platformPostId: publishData.id,
      publishedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { platform: 'instagram', success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

async function publishToFacebook(post: any): Promise<PublishResult> {
  const accessToken = Deno.env.get('META_PAGE_ACCESS_TOKEN');
  const pageId = Deno.env.get('FACEBOOK_PAGE_ID');

  if (!accessToken || !pageId) {
    return {
      platform: 'facebook',
      success: false,
      error: 'Facebook API credentials not configured. Please add META_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID.',
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
    if (data.error) {
      return { platform: 'facebook', success: false, error: data.error.message };
    }

    return {
      platform: 'facebook',
      success: true,
      platformPostId: data.id || data.post_id,
      publishedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { platform: 'facebook', success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

async function publishToWhatsApp(post: any): Promise<PublishResult> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!accessToken || !phoneNumberId) {
    return {
      platform: 'whatsapp',
      success: false,
      error: 'WhatsApp API credentials not configured. Please add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
    };
  }

  try {
    const message = buildCaption(post);

    // Send as a template or text message to WhatsApp Business API
    const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await res.json();
    if (data.error) {
      return { platform: 'whatsapp', success: false, error: data.error.message };
    }

    return {
      platform: 'whatsapp',
      success: true,
      platformPostId: data.messages?.[0]?.id,
      publishedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { platform: 'whatsapp', success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function buildCaption(post: any): string {
  let caption = post.caption || '';
  
  if (post.hashtags && post.hashtags.length > 0) {
    caption += '\n\n' + post.hashtags.map((h: string) => `#${h}`).join(' ');
  }
  
  if (post.link_url) {
    caption += '\n\n🔗 ' + post.link_url;
  }
  
  return caption;
}
