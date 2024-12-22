import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, Camera } from "lucide-react";
import { ChatInterface } from '@/components/ChatInterface';
import { createThread, sendMessage } from '@/services/openai';

const Index = () => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string; image?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initThread = async () => {
      try {
        const thread = await createThread();
        setThreadId(thread.id);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize chat. Please check your API key.",
          variant: "destructive"
        });
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
        title: "Error",
        description: "Chat not initialized. Please try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const base64Image = await convertToBase64(file);
      
      // Add the image message to the chat
      const userMessage = {
        role: 'user',
        content: 'Here is my handwriting sample:',
        image: base64Image
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Send the message to the assistant
      const response = await sendMessage(threadId, userMessage.content, base64Image);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.text
      }]);

    } catch (error) {
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
      <Card className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">Handwriting Analysis Assistant</h1>
          <p className="text-muted-foreground">Upload your handwriting sample for analysis and personalized practice sheets</p>
        </div>

        <ChatInterface messages={messages} />

        <div className="mt-4 flex gap-4 justify-center">
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
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Take Photo
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Index;