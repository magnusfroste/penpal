import React from 'react';

interface HandwritingExerciseSheetProps {
  practiceLetters: string[];
  improvements: string[];
  tips: string[];
}

const HandwritingExerciseSheet = ({ practiceLetters, improvements, tips }: HandwritingExerciseSheetProps) => {
  return (
    <div className="p-8 bg-white text-black">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Mitt handstilsövningsblad</h1>
        <p className="text-sm">Datum: {new Date().toLocaleDateString('sv-SE')}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Bokstäver att öva på:</h2>
        <div className="grid grid-cols-2 gap-4">
          {practiceLetters.map((letter, index) => (
            <div key={index} className="border-2 border-dashed border-gray-300 p-4">
              <div className="text-2xl font-bold mb-2 text-center">{letter}</div>
              <div className="h-20 border-b border-gray-300"></div>
              <div className="h-20 border-b border-gray-300"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Mina utmaningar:</h2>
        <ul className="list-disc pl-6 space-y-2">
          {improvements.map((improvement, index) => (
            <li key={index}>{improvement}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Tips för övning:</h2>
        <div className="grid grid-cols-1 gap-4">
          {tips.map((tip, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start">
                <span className="mr-2">🌟</span>
                <p>{tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Fortsätt öva och ha kul medan du förbättrar din handstil! 🌟</p>
      </div>
    </div>
  );
};

export default HandwritingExerciseSheet;