import { supabase } from "@/integrations/supabase/client";

export const createThread = async () => {
  return { id: 'direct-completion' };
};

export const sendMessage = async (threadId: string, content: string, image?: string) => {
  try {
    console.log('Starting to process message with image:', !!image);
    
    const { data, error } = await supabase.functions.invoke('analyze-handwriting', {
      body: {
        content,
        image
      }
    });

    if (error) {
      console.error('Error calling analyze-handwriting function:', error);
      throw error;
    }

    console.log('Response received from edge function:', data);
    return data;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};