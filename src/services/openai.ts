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

    // First, create the message with text content
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: content
    });

    // If there's an image, upload it and attach it to the thread
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
        purpose: 'assistants',
      });

      console.log('File uploaded successfully:', uploadedFile.id);
      
      // Create a new file attachment for the assistant using the correct API method
      await openai.beta.assistants.files.create(
        ASSISTANT_ID,
        { file_id: uploadedFile.id }
      );
    }

    console.log('Starting assistant run...');
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID
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