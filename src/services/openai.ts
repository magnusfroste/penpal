import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface SecretResponse {
  value: string;
}

const ASSISTANT_ID = 'asst_OBHVa19qPFsuQpBwX9ai6daM';

const getOpenAIKey = async () => {
  console.log('Starting OpenAI API key retrieval...');
  
  try {
    const { data, error } = await supabase.rpc('get_secret', {
      secret_name: 'OPENAI_API_KEY'
    });
    
    console.log('Raw Supabase response:', JSON.stringify(data, null, 2));
    
    if (error) {
      console.error('Error fetching OpenAI API key:', error);
      throw new Error('Failed to fetch OpenAI API key: ' + error.message);
    }
    
    if (!data) {
      console.error('No data returned from Supabase');
      throw new Error('No API key found. Please check if OPENAI_API_KEY is set in Supabase secrets.');
    }

    const secretValue = data.value;
    console.log('Secret value type:', typeof secretValue);
    console.log('Secret value exists:', !!secretValue);

    if (!secretValue) {
      console.error('API key is empty');
      throw new Error('OpenAI API key is not set. Please add your API key in the Supabase secrets.');
    }

    return secretValue;
  } catch (error) {
    console.error('Unexpected error in getOpenAIKey:', error);
    throw error;
  }
};

export const createThread = async () => {
  try {
    console.log('Starting thread creation...');
    const apiKey = await getOpenAIKey();
    
    if (!apiKey) {
      throw new Error('Failed to retrieve OpenAI API key');
    }
    
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
    const apiKey = await getOpenAIKey();
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    let fileId: string | undefined;

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

      fileId = uploadedFile.id;
      console.log('File uploaded successfully:', fileId);
    }

    const messageParams: any = {
      role: 'user',
      content: content,
    };

    if (fileId) {
      messageParams.file_ids = [fileId];
    }

    console.log('Sending message with params:', messageParams);
    await openai.beta.threads.messages.create(threadId, messageParams);

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
