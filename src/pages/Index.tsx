import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PenLine, Upload, ImagePlus } from "lucide-react";
import { ChatInterface } from '@/components/ChatInterface';
import { createThread, sendMessage } from '@/services/openai';
import { Progress } from "@/components/ui/progress";
import Footer from '@/components/Footer';

const Index = () => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string; image?: string; analysis?: any }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const file = event.target.files?.[0];
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
      
      // Simulate progress during base64 conversion and API call
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
      
      // Clear progress after a short delay
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
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 flex flex-col">
      <div className="flex-grow">
        <Card className="max-w-4xl mx-auto p-6 bg-white/80 backdrop-blur-sm shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <PenLine className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                PenPal
              </h1>
            </div>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Hej penkompis, nu skall du få visa mig vad du kan! Jag är så nyfiken på hur dina krumelurer ser ut idag, är du redo att dela med dig!?
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
              />
              
              <Button
                onClick={handleCameraClick}
                disabled={isLoading || isInitializing}
                className="w-full sm:w-auto bg-gradient-to-r from-primary/90 to-blue-600/90 hover:from-primary hover:to-blue-600 text-white shadow-md transition-all duration-300 gap-2"
                size="lg"
              >
                {isInitializing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                {isInitializing ? 'Initierar...' : 'Ta ett foto'}
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isInitializing}
                variant="outline"
                className="w-full sm:w-auto border-primary/20 hover:border-primary/40 transition-all duration-300 gap-2"
                size="lg"
              >
                <Upload className="h-5 w-5" />
                Välj en bild
              </Button>
            </div>

            {uploadProgress > 0 && (
              <div className="w-full max-w-md mx-auto mb-8">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
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
          </div>

          <ChatInterface messages={messages} />
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
