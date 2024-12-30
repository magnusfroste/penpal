import React from 'react';

interface HandwritingExerciseSheetProps {
  practiceLetters: string[];
  improvements: string[];
  tips: string[];
}

const HandwritingExerciseSheet = ({ practiceLetters, improvements, tips }: HandwritingExerciseSheetProps) => {
  return (
    <div className="p-6 bg-white text-black" style={{ width: '148mm', height: '210mm' }}> {/* Changed to A5 size */}
      <div className="text-center mb-4"> {/* Reduced margin */}
        <h1 className="text-xl font-bold mb-1">Mitt handstilsövningsblad</h1> {/* Smaller text */}
        <p className="text-xs">Datum: {new Date().toLocaleDateString('sv-SE')}</p> {/* Smaller text */}
      </div>

      <div className="mb-4"> {/* Reduced margin */}
        <h2 className="text-lg font-semibold mb-2">Bokstäver att öva på:</h2> {/* Smaller text */}
        <div className="grid grid-cols-2 gap-2"> {/* Reduced gap */}
          {practiceLetters.map((letter, index) => (
            <div key={index} className="border border-dashed border-gray-300 p-2"> {/* Thinner border, less padding */}
              <div className="text-xl font-bold mb-1 text-center">{letter}</div> {/* Smaller text */}
              <div className="h-16 border-b border-gray-300"></div> {/* Reduced height */}
              <div className="h-16 border-b border-gray-300"></div> {/* Reduced height */}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4"> {/* Reduced margin */}
        <h2 className="text-lg font-semibold mb-2">Mina utmaningar:</h2> {/* Smaller text */}
        <ul className="list-disc pl-4 space-y-1 text-sm"> {/* Reduced spacing and text size */}
          {improvements.map((improvement, index) => (
            <li key={index}>{improvement}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Tips för övning:</h2> {/* Smaller text */}
        <div className="grid grid-cols-1 gap-2"> {/* Reduced gap */}
          {tips.map((tip, index) => (
            <div key={index} className="p-2 border border-gray-200 rounded-lg text-sm"> {/* Less padding, smaller text */}
              <div className="flex items-start">
                <span className="mr-2">🌟</span>
                <p>{tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500"> {/* Reduced margin and text size */}
        <p>Fortsätt öva och ha kul medan du förbättrar din handstil! 🌟</p>
      </div>
    </div>
  );
};

export default HandwritingExerciseSheet;