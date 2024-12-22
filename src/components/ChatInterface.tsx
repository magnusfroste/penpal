import { ScrollArea } from "@/components/ui/scroll-area";
import AnalysisResponse from "./AnalysisResponse";

interface Message {
  role: string;
  content: string;
  image?: string;
  analysis?: {
    strengths: string[];
    improvements: string[];
    tips: string[];
  };
}

interface ChatInterfaceProps {
  messages: Message[];
}

export const ChatInterface = ({ messages }: ChatInterfaceProps) => {
  // Polyfill for findLast
  const findLast = <T,>(array: T[], predicate: (value: T) => boolean): T | undefined => {
    for (let i = array.length - 1; i >= 0; i--) {
      if (predicate(array[i])) {
        return array[i];
      }
    }
    return undefined;
  };

  const lastAssistantMessage = findLast(messages, m => m.role === 'assistant');
  const userMessage = findLast(messages, m => m.role === 'user');

  if (!messages.length) {
    return null;
  }

  if (lastAssistantMessage && userMessage) {
    return <AnalysisResponse message={lastAssistantMessage} />;
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border p-4">
      <div className="chat-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.role === 'user' ? 'user-message' : 'assistant-message'
            }`}
          >
            {message.image && (
              <img
                src={message.image}
                alt="Handskriftsprov"
                className="image-preview mb-2"
              />
            )}
            <p>{message.content}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};