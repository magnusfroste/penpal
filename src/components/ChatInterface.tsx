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
  const lastMessage = messages[messages.length - 1];

  if (!messages.length) {
    return null;
  }

  return <AnalysisResponse message={lastMessage} />;
};