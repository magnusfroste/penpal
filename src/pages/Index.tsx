import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, Camera } from "lucide-react";
import { ChatInterface } from '@/components/ChatInterface';

const Index = () => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string; image?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

    try {
      setIsLoading(true);
      const base64Image = await convertToBase64(file);
      
      // Add the image message to the chat
      setMessages(prev => [...prev, {
        role: 'user',
        content: 'Here is my handwriting sample:',
        image: base64Image
      }]);

      // Here we would normally make the API call to OpenAI
      // For now, we'll add a placeholder response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I notice that your letter "a" could use some improvement. The loop seems a bit inconsistent. Would you like some practice sheets for this letter?'
        }]);
        setIsLoading(false);
      }, 2000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive"
      });
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