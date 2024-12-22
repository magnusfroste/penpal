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
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg max-w-full ${
            message.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {message.image && (
            <img
              src={message.image}
              alt="Handskriftsprov"
              className="max-w-xs rounded-lg shadow-lg mx-auto mb-2"
            />
          )}
          <p>{message.content}</p>
        </div>
      ))}
    </div>
  );
};