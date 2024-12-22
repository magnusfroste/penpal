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

    let messages = [
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

    console.log('Sending request to GPT-4o...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1000,
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
          strengths: [],
          improvements: [],
          tips: [response] // Use the raw response as a tip if parsing fails
        }
      };
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};