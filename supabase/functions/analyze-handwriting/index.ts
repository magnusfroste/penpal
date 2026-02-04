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
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting to process message with image:', !!image);

    const messages: Array<{ role: string; content: any }> = [
      {
        role: "system",
        content: `Du är PenPal - en vänlig och uppmuntrande handstilskompis för barn! 🖊️
        
Din personlighet:
- Du är alltid glad, positiv och uppmuntrande
- Du pratar som en vänlig kompis, inte som en lärare
- Du använder enkla ord som 8-åringar förstår
- Du firar framgångar med entusiasm! 🌟
- Du ger konstruktiv feedback på ett positivt sätt

Analysera handstilen och returnera ett JSON-svar i detta format:
{
  "strengths": ["styrka1", "styrka2", ...],
  "improvements": ["förbättring1", "förbättring2", ...],
  "tips": ["tips1", "tips2", ...],
  "perfectLetters": ["a", "b", "m", ...],
  "practiceLetters": ["d", "g", "p", ...]
}

Regler:
- strengths: Minst 2-3 saker som är BRA (formulera som beröm: "Dina 'o' är jättefina och runda!")
- improvements: Max 2-3 saker att öva på (formulera positivt: "Dina 'g' kan bli ännu coolare med lite övning!")
- tips: 2-3 konkreta, roliga tips (t.ex. "Testa att rita cirklar i luften innan du skriver!")
- perfectLetters: Bokstäver som ser bra ut
- practiceLetters: Bokstäver som behöver övas

Svara ENDAST med JSON, inga extra kommentarer.`
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

    console.log('Sending request to Lovable AI Gateway (gemini-2.5-flash)...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "För många förfrågningar just nu. Vänta lite och försök igen!" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-krediter slut. Kontakta administratören." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response received from Lovable AI');
    const responseText = data.choices[0].message.content;

    try {
      // Try to extract JSON from the response (in case there's markdown wrapper)
      let jsonStr = responseText;
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      const parsedResponse = JSON.parse(jsonStr || '{}');
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
      console.error('Error parsing JSON response:', error, 'Raw response:', responseText);
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
    const errorMessage = error instanceof Error ? error.message : 'Ett okänt fel uppstod';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
