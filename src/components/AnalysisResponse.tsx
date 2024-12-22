import React from 'react';
import { Card } from "@/components/ui/card";
import { Check, Info, AlertTriangle } from "lucide-react";

interface Analysis {
  strengths: string[];
  improvements: string[];
  tips: string[];
}

interface AnalysisResponseProps {
  message: {
    content: string;
    image?: string;
    analysis?: Analysis;
  };
}

const AnalysisResponse = ({ message }: AnalysisResponseProps) => {
  const analysis = message.analysis || {
    strengths: [],
    improvements: [],
    tips: []
  };

  if (!analysis.strengths.length && !analysis.improvements.length && !analysis.tips.length) {
    const lines = message.content.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('positive')) {
        analysis.strengths.push(line);
      } else if (line.toLowerCase().includes('improve') || line.toLowerCase().includes('work on')) {
        analysis.improvements.push(line);
      } else {
        analysis.tips.push(line);
      }
    });
  }

  return (
    <div className="w-full space-y-6">
      {message.image && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Din handstil</h3>
          <img
            src={message.image}
            alt="Handskriftsprov"
            className="max-w-sm rounded-lg shadow-lg mx-auto"
          />
        </div>
      )}
      
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
    </div>
  );
};

export default AnalysisResponse;