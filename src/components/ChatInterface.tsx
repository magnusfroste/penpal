import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: string;
  content: string;
  image?: string;
}

interface ChatInterfaceProps {
  messages: Message[];
}

export const ChatInterface = ({ messages }: ChatInterfaceProps) => {
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
                alt="Handwriting sample"
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