import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface SecretResponse {
  value: string;
}

const getOpenAIKey = async () => {
  const { data, error } = await supabase.rpc('get_secret', {
    secret_name: 'OPENAI_API_KEY'
  });
  
  if (error) throw error;
  
  // First cast to unknown, then to our expected interface
  const secretData = (data as unknown) as SecretResponse;
  if (!secretData || !secretData.value) {
    throw new Error('OpenAI API key not found or invalid');
  }
  
  return secretData.value;
};

const ASSISTANT_ID = 'asst_OBHVa19qPFsuQpBwX9ai6daM';

export const createThread = async () => {
  const apiKey = await getOpenAIKey();
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    const thread = await openai.beta.threads.create();
    return thread;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
};

export const sendMessage = async (threadId: string, content: string, image?: string) => {
  const apiKey = await getOpenAIKey();
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    let fileId: string | undefined;

    // If an image is provided, upload it first
    if (image) {
      // Convert base64 to blob
      const base64Data = image.split(',')[1];
      const binaryData = atob(base64Data);
      const array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'image/jpeg' });

      // Create a File object from the blob
      const file = new File([blob], 'handwriting.jpg', { type: 'image/jpeg' });

      // Upload the file to OpenAI
      const uploadedFile = await openai.files.create({
        file,
        purpose: 'assistants',
      });

      fileId = uploadedFile.id;
    }

    // Add the message to the thread
    const messageParams: any = {
      role: 'user',
      content: content,
    };

    if (fileId) {
      messageParams.file_ids = [fileId];
    }

    await openai.beta.threads.messages.create(threadId, messageParams);

    // Run the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      
      if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0].content[0];
    
    // Extract text content from the response
    if (lastMessage.type === 'text') {
      return { text: lastMessage.text.value };
    } else {
      return { text: 'I received your image but can only respond with text messages.' };
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};