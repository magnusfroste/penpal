import OpenAI from 'openai';

const ASSISTANT_ID = 'asst_OBHVa19qPFsuQpBwX9ai6daM';

const getOpenAIKey = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not set in environment variables');
  }
  
  return apiKey;
};

export const createThread = async () => {
  try {
    console.log('Starting thread creation...');
    const apiKey = getOpenAIKey();
    
    console.log('Initializing OpenAI client...');
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    console.log('Creating thread...');
    const thread = await openai.beta.threads.create();
    console.log('Thread created successfully:', thread.id);
    return thread;
  } catch (error) {
    console.error('Error in createThread:', error);
    throw error;
  }
};

export const sendMessage = async (threadId: string, content: string, image?: string) => {
  try {
    console.log('Starting to send message to thread:', threadId);
    const apiKey = getOpenAIKey();
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    let messageContent: any[] = [
      {
        type: 'text',
        text: content
      }
    ];

    if (image) {
      console.log('Processing image upload...');
      const base64Data = image.split(',')[1];
      const binaryData = atob(base64Data);
      const array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'image/jpeg' });
      const file = new File([blob], 'handwriting.jpg', { type: 'image/jpeg' });

      const uploadedFile = await openai.files.create({
        file,
        purpose: "assistants"
      });

      console.log('File uploaded successfully:', uploadedFile.id);
      
      await openai.beta.assistants.update(
        ASSISTANT_ID,
        {
          tools: [{ type: "code_interpreter" }],
          file_ids: [uploadedFile.id]
        }
      );

      messageContent.push({
        type: 'image_file',
        image_file: {
          file_id: uploadedFile.id
        }
      });
    }

    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: messageContent
    });

    console.log('Starting assistant run...');
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
      instructions: `Please analyze the handwriting sample and provide your analysis in the following format:
      {
        "strengths": ["strength1", "strength2", ...],
        "improvements": ["improvement1", "improvement2", ...],
        "tips": ["tip1", "tip2", ...]
      }`
    });

    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      console.log('Current run status:', runStatus.status);
      
      if (runStatus.status === 'failed') {
        console.error('Assistant run failed:', runStatus);
        throw new Error('Assistant run failed');
      }
    }

    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0].content[0];
    
    if (lastMessage.type === 'text') {
      console.log('Response received successfully');
      try {
        // Try to parse the response as JSON
        const jsonMatch = lastMessage.text.value.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonResponse = JSON.parse(jsonMatch[0]);
          return { text: lastMessage.text.value, analysis: jsonResponse };
        }
      } catch (error) {
        console.log('Failed to parse JSON response:', error);
      }
      return { text: lastMessage.text.value };
    } else {
      console.log('Non-text response received');
      return { text: 'I received your image but can only respond with text messages.' };
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};