import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface SecretResponse {
  value: string;
}

const getOpenAIKey = async () => {
  console.log('Fetching OpenAI API key...');
  const { data, error } = await supabase.rpc('get_secret', {
    secret_name: 'OPENAI_API_KEY'
  });
  
  if (error) {
    console.error('Error fetching OpenAI API key:', error);
    throw new Error('Failed to fetch OpenAI API key: ' + error.message);
  }
  
  if (!data) {
    console.error('No data returned when fetching OpenAI API key');
    throw new Error('No API key found. Please set your OpenAI API key in Supabase secrets.');
  }

  // Cast the data to our expected type
  const secretData = data as unknown as SecretResponse;
  
  if (!secretData.value) {
    console.error('API key value is empty or undefined');
    throw new Error('Invalid API key format. Please check your OpenAI API key in Supabase secrets.');
  }
  
  console.log('API key retrieved successfully');
  return secretData.value;
};

export const createThread = async () => {
  try {
    console.log('Starting thread creation...');
    const apiKey = await getOpenAIKey();
    console.log('API key retrieved successfully');
    
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

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
    const apiKey = await getOpenAIKey();
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    let fileId: string | undefined;

    if (image) {
      console.log('Processing image upload...');
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
      console.log('File uploaded successfully:', fileId);
    }

    // Add the message to the thread
    const messageParams: any = {
      role: 'user',
      content: content,
    };

    if (fileId) {
      messageParams.file_ids = [fileId];
    }

    console.log('Sending message with params:', messageParams);
    await openai.beta.threads.messages.create(threadId, messageParams);

    // Run the assistant
    console.log('Starting assistant run...');
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID
    });

    // Wait for the run to complete
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

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0].content[0];
    
    // Extract text content from the response
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