import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Camera } from "lucide-react";
import { ChatInterface } from '@/components/ChatInterface';
import { createThread, sendMessage } from '@/services/openai';

interface Analysis {
  strengths: string[];
  improvements: string[];
  tips: string[];
}

interface Message {
  role: string;
  content: string;
  image?: string;
  analysis?: Analysis;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initThread = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);
        
        const thread = await createThread();
        setThreadId(thread.id);
        
        setMessages([{
          role: 'assistant',
          content: 'Hello! I\'m ready to analyze your handwriting. Please upload a clear image of your handwriting sample.'
        }]);
        
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
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    if (!threadId) {
      toast({
        title: "Chat not ready",
        description: "Please wait for the chat to initialize and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const base64Image = await convertToBase64(file);
      
      const userMessage = {
        role: 'user',
        content: 'Here is my handwriting sample:',
        image: base64Image
      };
      
      setMessages(prev => [...prev, userMessage]);

      const response = await sendMessage(threadId, userMessage.content, base64Image);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.text,
        analysis: response.analysis
      }]);

    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive"
      });
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
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">Handwriting Analysis Assistant</h1>
          <p className="text-muted-foreground mb-6">Upload your handwriting sample for analysis and personalized practice sheets</p>
          
          <div className="flex gap-4 justify-center mb-8">
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
              className="gap-2"
            >
              {isInitializing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {isInitializing ? 'Initializing...' : 'Take Photo'}
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isInitializing}
              variant="outline"
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>
          </div>

          {initError && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
              <p className="font-semibold">Error initializing chat:</p>
              <p className="text-sm">{initError}</p>
            </div>
          )}
        </div>

        <ChatInterface messages={messages} />
      </Card>
    </div>
  );
};

export default Index;