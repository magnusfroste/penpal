import React from 'react';
import { Card } from "@/components/ui/card";
import { Check, Info, AlertTriangle, PenTool, Star } from "lucide-react";
import HandwritingScore from '../HandwritingScore';

interface Analysis {
  strengths: string[];
  improvements: string[];
  tips: string[];
  perfectLetters: string[];
  practiceLetters: string[];
}

interface AnalysisContentProps {
  analysis: Analysis;
  image?: string;
}

const AnalysisContent = ({ analysis, image }: AnalysisContentProps) => {
  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <HandwritingScore 
        strengths={analysis.strengths}
        improvements={analysis.improvements}
        perfectLetters={analysis.perfectLetters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-green-100">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-green-700 mb-2 sm:mb-3">
            <Check className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Styrkor
          </h3>
          <ul className="space-y-1.5 sm:space-y-2">
            {analysis.strengths.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-green-800 text-sm sm:text-base">
                <span className="mt-0.5">•</span>
                {point}
              </li>
            ))}
          </ul>
        </Card>

        {analysis.improvements.length > 0 && (
          <Card className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-amber-100">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-amber-700 mb-2 sm:mb-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Förbättringsområden
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {analysis.improvements.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-amber-800 text-sm sm:text-base">
                  <span className="mt-0.5">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-blue-700 mb-2 sm:mb-3">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Bokstäver som ser bra ut
          </h3>
          <div className="flex flex-wrap gap-1">
            {analysis.perfectLetters.map((letter, index) => (
              <span key={index} className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 text-base sm:text-lg font-medium rounded-full bg-background border-2">
                {letter}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-purple-700 mb-2 sm:mb-3">
            <PenTool className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Bokstäver att öva på
          </h3>
          <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
            {analysis.practiceLetters.map((letter, index) => (
              <span key={index} className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 text-base sm:text-lg font-medium rounded-full bg-background border-2">
                {letter}
              </span>
            ))}
          </div>
          {image && (
            <div className="mt-3 sm:mt-4">
              <img
                src={image}
                alt="Handskriftsprov"
                className="rounded-lg shadow-lg mx-auto max-h-[200px] sm:max-h-[300px] object-contain"
              />
            </div>
          )}
        </Card>
      </div>

      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-blue-700 mb-2 sm:mb-3">
          <Info className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          Tips och övningar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {analysis.tips.map((point, index) => (
            <Card 
              key={index} 
              className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:shadow-md transition-shadow"
            >
              <p className="text-blue-800 text-sm sm:text-base">{point}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisContent;