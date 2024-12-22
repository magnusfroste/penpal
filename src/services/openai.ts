import OpenAI from 'openai';

const ASSISTANT_ID = 'asst_OBHVa19qPFsuQpBwX9ai6daM';

export const createThread = async () => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  try {
    // Add the message to the thread
    const messageParams: OpenAI.Beta.Threads.MessageCreateParams = {
      role: 'user',
      content: content,
    };

    // If an image is provided, we'll need to handle file upload first
    if (image) {
      // Note: This is a placeholder. You'll need to implement actual file upload logic
      // This might involve uploading the file to OpenAI and getting a file ID
      // messageParams.file_ids = [uploadedFileId];
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
    return messages.data[0].content[0];
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};