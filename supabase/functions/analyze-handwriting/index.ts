import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRequest {
  content: string;
  image?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, image }: AnalyzeRequest = await req.json();
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log('Starting to process message with image:', !!image);

    const messages: Array<{ role: string; content: any }> = [
      {
        role: "system",
        content: `Du är en handstilsexpert som hjälper en 8-årig elev att förbättra sin handstil. 
        Var pedagogisk, uppmuntrande och rolig! Analysera handstilen och returnera ett JSON-svar i detta format:
        {
          "strengths": ["styrka1", "styrka2", ...],
          "improvements": ["förbättring1", "förbättring2", ...],
          "tips": ["tips1", "tips2", ...],
          "perfectLetters": ["a", "b", "m", ...],
          "practiceLetters": ["d", "g", "p", ...]
        }
        Analysera specifika bokstäver och kategorisera dem i perfectLetters (välformade bokstäver) och practiceLetters (bokstäver som behöver övas på).
        Håll varje punkt kortfattad och barnanpassad. Svara ENDAST med JSON, inga extra kommentarer.`
      }
    ];

    const userMessage = {
      role: "user",
      content: image ? [
        {
          type: "text",
          text: "Analysera detta handstilsprov:"
        },
        {
          type: "image_url",
          image_url: {
            url: image
          }
        }
      ] : content
    };

    messages.push(userMessage);

    console.log('Sending request to GPT-4.1...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: messages,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    console.log('Response received:', data.choices[0].message);
    const responseText = data.choices[0].message.content;

    try {
      const parsedResponse = JSON.parse(responseText || '{}');
      console.log('Parsed response:', parsedResponse);
      
      return new Response(JSON.stringify({
        text: responseText,
        analysis: {
          strengths: parsedResponse.strengths || [],
          improvements: parsedResponse.improvements || [],
          tips: parsedResponse.tips || [],
          perfectLetters: parsedResponse.perfectLetters || [],
          practiceLetters: parsedResponse.practiceLetters || []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return new Response(JSON.stringify({
        text: responseText,
        analysis: {
          strengths: ['Din handstil visar potential!'],
          improvements: ['Vi kunde inte analysera bilden ordentligt'],
          tips: ['Försök ta ett tydligare foto med bra belysning'],
          perfectLetters: [],
          practiceLetters: []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in analyze-handwriting function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});