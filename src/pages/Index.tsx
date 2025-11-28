import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChatInterface } from '@/components/ChatInterface';
import { createThread, sendMessage } from '@/services/openai';
import { Progress } from "@/components/ui/progress";
import Footer from '@/components/Footer';
import HandwritingHeader from '@/components/HandwritingHeader';
import UploadButtons from '@/components/UploadButtons';
import InstallPrompt from '@/components/InstallPrompt';

const Index = () => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string; image?: string; analysis?: any }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initThread = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);
        
        const thread = await createThread();
        setThreadId(thread.id);
        setMessages([]); 
        
      } catch (error) {
        console.error('Thread initialization error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setInitError(errorMessage);
        toast({
          title: "Initialization Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initThread();
  }, [toast]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File upload triggered on iOS');
    const file = event.target.files?.[0];
    console.log('Selected file:', file?.name, file?.type);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ogiltig filtyp",
        description: "Vänligen ladda upp en bildfil",
        variant: "destructive"
      });
      return;
    }

    if (!threadId) {
      toast({
        title: "Chatten är inte redo",
        description: "Vänta tills chatten har initierats och försök igen.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(0);
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const base64Image = await convertToBase64(file);
      
      const userMessage = {
        role: 'user',
        content: 'Here is my handwriting sample:',
        image: base64Image
      };
      
      setMessages(prev => [...prev, userMessage]);

      const response = await sendMessage(threadId, userMessage.content, base64Image);
      console.log('Response from API:', response);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.text,
        analysis: response.analysis
      };

      setMessages(prev => [...prev, assistantMessage]);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Error",
        description: "Det gick inte att analysera bilden. Försök igen.",
        variant: "destructive"
      });
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-3 py-4 sm:p-6 flex flex-col safe-area-inset">
      <div className="flex-grow">
        <Card className="max-w-4xl mx-auto p-4 sm:p-6 bg-card/90 backdrop-blur-sm shadow-lg border border-border/50">
          <HandwritingHeader />
          
          {/* Separata inputs för kamera och filval - fungerar bättre på iOS */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            ref={cameraInputRef}
            className="hidden"
          />
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          
          <UploadButtons
            isLoading={isLoading}
            isInitializing={isInitializing}
            handleCameraClick={handleCameraClick}
            handleFileClick={handleFileClick}
          />

          {uploadProgress > 0 && (
            <div className="w-full max-w-md mx-auto mb-6 sm:mb-8 mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">
                {uploadProgress < 100 ? 'Analyserar din handstil...' : 'Analys klar!'}
              </p>
            </div>
          )}

          {initError && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
              <p className="font-semibold">Ett fel uppstod vid initiering:</p>
              <p className="text-sm">{initError}</p>
            </div>
          )}

          <ChatInterface messages={messages} />
        </Card>
      </div>
      <Footer />
      <InstallPrompt />
    </div>
  );
};

export default Index;