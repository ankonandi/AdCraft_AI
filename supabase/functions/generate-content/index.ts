import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, imageData, productInfo, goal, platforms } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating content:', { type, goal, platforms });

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'description') {
      systemPrompt = `You are a creative product description writer for independent creators and artisans. 
Generate compelling, SEO-friendly product descriptions that are warm, authentic, and help small businesses sell online.
Focus on highlighting unique features, craftsmanship, and the story behind products.
Return your response as a JSON object with this structure:
{
  "title": "Product title (max 100 chars)",
  "short_description": "Brief description (max 160 chars)",
  "long_description": "Detailed SEO description (2-3 paragraphs)",
  "category": "Product category",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

      userPrompt = `Generate product content for: ${productInfo || 'a handcrafted artisan product'}`;
      
    } else if (type === 'campaign') {
      const platformsList = platforms?.join(', ') || 'social media';
      systemPrompt = `You are a social media marketing expert specializing in helping small businesses and creators.
Generate engaging marketing campaign content that drives sales and engagement.
Focus on authentic storytelling, clear calls-to-action, and platform-appropriate messaging.
Return your response as a JSON object with this structure:
{
  "caption": "Engaging post caption (150-200 words)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "whatsapp_message": "Short WhatsApp selling message (max 100 words)",
  "slogan": "Catchy campaign slogan"
}`;

      userPrompt = `Create a ${goal || 'engagement'} campaign for ${productInfo || 'an artisan product'} on ${platformsList}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service requires payment. Please check your account.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = JSON.parse(data.choices[0].message.content);

    console.log('Content generated successfully');

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-content function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
