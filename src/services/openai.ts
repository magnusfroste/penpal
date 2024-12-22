import OpenAI from 'openai';

const getOpenAIKey = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not set in environment variables');
  }
  
  return apiKey;
};

export const createThread = async () => {
  // We'll keep this simple since we don't need threads anymore
  return { id: 'direct-completion' };
};

export const sendMessage = async (threadId: string, content: string, image?: string) => {
  try {
    console.log('Starting to process message...');
    const apiKey = getOpenAIKey();
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    let messages: any[] = [
      {
        role: "system",
        content: `You are a handwriting analysis expert helping an 8-year-old student improve their handwriting. 
        Be pedagogical, encouraging, and fun! Analyze the handwriting and return your response in this exact JSON format:
        {
          "strengths": ["strength1", "strength2", ...],
          "improvements": ["improvement1", "improvement2", ...],
          "tips": ["tip1", "tip2", ...]
        }
        Keep each point concise and child-friendly.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze this handwriting sample:"
          }
        ]
      }
    ];

    if (image) {
      messages[1].content.push({
        type: "image_url",
        image_url: {
          url: image
        }
      });
    }

    console.log('Sending request to GPT-4 Vision...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: messages,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;
    console.log('Response received:', response);

    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(response || '{}');
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
      // Fallback to text response if JSON parsing fails
      return { text: response };
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};
