import OpenAI from 'openai';

const getOpenAIKey = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not set in environment variables');
  }
  
  return apiKey;
};

export const createThread = async () => {
  return { id: 'direct-completion' };
};

export const sendMessage = async (threadId: string, content: string, image?: string) => {
  try {
    console.log('Starting to process message with image:', !!image);
    const apiKey = getOpenAIKey();
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    const messages: Array<{ role: string; content: any }> = [
      {
        role: "system",
        content: `Du är en handstilsexpert som hjälper en 8-årig elev att förbättra sin handstil. 
        Var pedagogisk, uppmuntrande och rolig! Analysera handstilen och returnera ett JSON-svar i detta format:
        {
          "strengths": ["styrka1", "styrka2", ...],
          "improvements": ["förbättring1", "förbättring2", ...],
          "tips": ["tips1", "tips2", ...]
        }
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

    console.log('Sending request to GPT-4o...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    console.log('Response received:', completion.choices[0].message);
    const response = completion.choices[0].message.content;

    try {
      const parsedResponse = JSON.parse(response || '{}');
      console.log('Parsed response:', parsedResponse);
      
      return {
        text: response,
        analysis: {
          strengths: parsedResponse.strengths || [],
          improvements: parsedResponse.improvements || [],
          tips: parsedResponse.tips || []
        }
      };
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return {
        text: response,
        analysis: {
          strengths: ['Din handstil visar potential!'],
          improvements: ['Vi kunde inte analysera bilden ordentligt'],
          tips: ['Försök ta ett tydligare foto med bra belysning']
        }
      };
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};