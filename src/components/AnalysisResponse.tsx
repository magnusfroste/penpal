import React from 'react';
import { Card } from "@/components/ui/card";
import { Check, Info, AlertTriangle, Loader2, Star, PenTool } from "lucide-react";

interface Analysis {
  strengths: string[];
  improvements: string[];
  tips: string[];
  perfectLetters: string[];
  practiceLetters: string[];
}

interface AnalysisResponseProps {
  message: {
    content: string;
    image?: string;
    analysis?: Analysis;
  };
}

const AnalysisResponse = ({ message }: AnalysisResponseProps) => {
  const [isThinking, setIsThinking] = React.useState(true);

  React.useEffect(() => {
    // Simulate AI thinking time for a smoother UX
    const timer = setTimeout(() => {
      setIsThinking(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const analysis = message.analysis || {
    strengths: [],
    improvements: [],
    tips: [],
    perfectLetters: [],
    practiceLetters: []
  };

  const LetterBadge = ({ letter }: { letter: string }) => (
    <span className="inline-block px-3 py-1 m-1 text-lg font-medium rounded-full bg-background border-2">
      {letter}
    </span>
  );

  return (
    <div className="w-full space-y-6">
      {/* Image is now always shown, regardless of thinking state */}
      {message.image && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Din handstil</h3>
          <img
            src={message.image}
            alt="Handskriftsprov"
            className="rounded-lg shadow-lg mx-auto max-h-[300px] object-contain"
          />
        </Card>
      )}
      
      {isThinking ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">AI:n analyserar din handstil...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700 mb-3">
              <Check className="h-5 w-5" />
              Styrkor
            </h3>
            <ul className="space-y-2">
              {analysis.strengths.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-green-800">
                  <span className="mt-1">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-amber-50 to-amber-100">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-700 mb-3">
              <AlertTriangle className="h-5 w-5" />
              Förbättringsområden
            </h3>
            <ul className="space-y-2">
              {analysis.improvements.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-amber-800">
                  <span className="mt-1">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-700 mb-3">
                <Star className="h-5 w-5" />
                Bokstäver som ser bra ut
              </h3>
              <div className="flex flex-wrap">
                {analysis.perfectLetters.map((letter, index) => (
                  <LetterBadge key={index} letter={letter} />
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-purple-700 mb-3">
                <PenTool className="h-5 w-5" />
                Bokstäver att öva på
              </h3>
              <div className="flex flex-wrap">
                {analysis.practiceLetters.map((letter, index) => (
                  <LetterBadge key={index} letter={letter} />
                ))}
              </div>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-700 mb-3">
              <Info className="h-5 w-5" />
              Tips och övningar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.tips.map((point, index) => (
                <Card 
                  key={index} 
                  className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:shadow-md transition-shadow"
                >
                  <p className="text-blue-800">{point}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResponse;