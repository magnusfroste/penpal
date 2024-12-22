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
          file_ids: [uploadedFile.id]
        } as any
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
      instructions: `Du är en erfaren lärare som hjälper en 8-årig elev med handstilen. 
      När du analyserar handstilen, dela upp din analys i tre tydliga delar:
      
      1. Styrkor - Berätta vad eleven gör bra (t.ex. bokstävernas storlek, mellanrum mellan ord, lutning, skrivhastighet, penngrepp etc.)
      2. Förbättringsområden - Förklara vänligt vad som kan bli bättre. Använd uppmuntrande ord och fokusera på max 2-3 saker att förbättra.
      3. Tips och övningar - Ge 2-3 specifika och roliga övningar. Gör dem lekfulla, som att "rita bokstaven som en orm som slingrar sig" eller "skriv bokstaven som en superhjälte som flyger".
      
      Viktigt att tänka på:
      - Börja alltid med att berömma något positivt
      - Använd ett enkelt och lekfullt språk som ett barn förstår
      - Var entusiastisk och uppmuntrande i din ton
      - Jämför gärna med roliga saker som barn känner till
      - Ge konkreta exempel på hur förbättringarna kan göras
      
      Formatera svaret så här:
      STYRKOR:
      - [styrka 1]
      - [styrka 2]
      
      FÖRBÄTTRINGSOMRÅDEN:
      - [förbättring 1]
      - [förbättring 2]
      
      TIPS OCH ÖVNINGAR:
      - [tips 1]
      - [tips 2]
      
      Efter analysen, fråga om eleven vill ha ett roligt PDF-dokument med bokstäver att öva på, anpassat efter deras behov.`
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
      const text = lastMessage.text.value;
      
      // Parse the response into sections
      const analysis = {
        strengths: [] as string[],
        improvements: [] as string[],
        tips: [] as string[]
      };
      
      let currentSection = '';
      const lines = text.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('STYRKOR:')) {
          currentSection = 'strengths';
        } else if (trimmedLine.startsWith('FÖRBÄTTRINGSOMRÅDEN:')) {
          currentSection = 'improvements';
        } else if (trimmedLine.startsWith('TIPS OCH ÖVNINGAR:')) {
          currentSection = 'tips';
        } else if (trimmedLine.startsWith('-') && currentSection) {
          analysis[currentSection].push(trimmedLine.substring(1).trim());
        }
      }
      
      return { 
        text,
        analysis
      };
    } else {
      console.log('Non-text response received');
      return { 
        text: 'Jag tog emot din bild men kan bara svara med text.',
        analysis: {
          strengths: [],
          improvements: [],
          tips: []
        }
      };
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};