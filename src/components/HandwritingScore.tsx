import React from 'react';
import { Card } from "@/components/ui/card";
import { Star, Trophy, Award, Smile, SmilePlus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HandwritingScoreProps {
  strengths: string[];
  improvements: string[];
  perfectLetters: string[];
}

const HandwritingScore = ({ strengths, improvements, perfectLetters }: HandwritingScoreProps) => {
  // Calculate score based on analysis
  const calculateScore = () => {
    const totalPoints = 100;
    const strengthPoints = strengths.length * 15;
    const improvementPenalty = improvements.length * 10;
    const perfectLetterPoints = perfectLetters.length * 10; // Increased from 5 to 10 points
    
    let score = Math.min(strengthPoints + perfectLetterPoints - improvementPenalty, totalPoints);
    score = Math.max(score, 0); // Ensure score doesn't go below 0
    return score;
  };

  const score = calculateScore();
  
  // Determine achievement level
  const getAchievementDetails = () => {
    if (score >= 90) {
      return {
        icon: <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 animate-bounce" />,
        title: "Mästerlig handstil!",
        message: "Du är en riktig handstilskonstnär! 🏆"
      };
    } else if (score >= 70) {
      return {
        icon: <Award className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500" />,
        title: "Utmärkt arbete!",
        message: "Din handstil är verkligen imponerande! 🌟"
      };
    } else if (score >= 50) {
      return {
        icon: <SmilePlus className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />,
        title: "Bra jobbat!",
        message: "Du är på rätt väg! 😊"
      };
    } else {
      return {
        icon: <Smile className="h-10 w-10 sm:h-12 sm:w-12 text-purple-500" />,
        title: "Bra försök!",
        message: "Fortsätt öva, du kommer bli bättre! 💪"
      };
    }
  };

  const achievement = getAchievementDetails();

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 mb-4 sm:mb-6">
      <div className="text-center space-y-3 sm:space-y-4">
        {achievement.icon}
        <h2 className="text-xl sm:text-2xl font-bold text-indigo-900">{achievement.title}</h2>
        <div className="flex justify-center items-center gap-1">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              className={`h-6 w-6 sm:h-8 sm:w-8 ${
                index < Math.floor(score / 20)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="text-3xl sm:text-4xl font-bold text-indigo-600">
          {score}<span className="text-xl sm:text-2xl">/100</span>
        </div>
        <p className="text-base sm:text-lg text-indigo-700">{achievement.message}</p>
        
        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-indigo-600 space-y-0.5">
          <p>Perfekta bokstäver: +{perfectLetters.length * 10} poäng</p>
          <p>Styrkor: +{strengths.length * 15} poäng</p>
          {improvements.length > 0 && (
            <p>Förbättringsområden: -{improvements.length * 10} poäng</p>
          )}
        </div>

        <div className="mt-3 sm:mt-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 cursor-help">
                  <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Hur räknas poängen?</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white shadow-lg">
                <div className="p-3 sm:p-4 text-xs sm:text-sm">
                  <h4 className="font-semibold mb-2">Poängberäkning för handstil</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Varje styrka ger 15 poäng</li>
                    <li>Varje förbättringsområde drar av 10 poäng</li>
                    <li>Varje perfekt bokstav ger 10 poäng</li>
                    <li>Totala poängen stannar mellan 0-100</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
};

export default HandwritingScore;