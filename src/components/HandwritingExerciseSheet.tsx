import React from 'react';

interface HandwritingExerciseSheetProps {
  practiceLetters: string[];
  improvements: string[];
  tips: string[];
}

const HandwritingExerciseSheet = ({ practiceLetters, improvements, tips }: HandwritingExerciseSheetProps) => {
  const renderLine = (isDotted = false) => (
    <div 
      className={`h-8 ${isDotted ? 'border-b-2 border-dotted border-blue-400' : 'border-b border-gray-400'} relative`}
      style={{ marginBottom: '4px' }}
    >
      {isDotted && (
        <div className="absolute left-0 right-0 top-1/2 border-b border-dotted border-blue-200"></div>
      )}
    </div>
  );

  const encouragementEmojis = ["🌟", "⭐", "✨", "🎉", "💪", "🏆", "🚀", "🎨"];
  const getRandomEmoji = () => encouragementEmojis[Math.floor(Math.random() * encouragementEmojis.length)];

  return (
    <div className="p-6 bg-white text-black" style={{ width: '210mm', height: '297mm', fontFamily: 'Arial, sans-serif' }}>
      {/* Header med roliga färger */}
      <div className="text-center mb-6 bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg border-2 border-dashed border-blue-300">
        <h1 className="text-3xl font-bold mb-2 text-blue-800">
          🌟 Mitt Magiska Handstilsövningsblad 🌟
        </h1>
        <p className="text-sm text-purple-700 font-semibold">
          📅 Datum: {new Date().toLocaleDateString('sv-SE')} | 👤 Mitt namn: ________________
        </p>
      </div>

      {/* Bokstäver att öva */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-green-700 flex items-center">
          ✏️ Bokstäver att träna på: {getRandomEmoji()}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {practiceLetters.map((letter, index) => (
            <div key={index} className="border-2 border-dashed border-green-300 p-3 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold mb-2 text-center text-green-800 bg-yellow-200 rounded p-1">
                {letter}
              </div>
              <div className="space-y-1">
                {/* Exempel-bokstav med prickad linje */}
                <div className="text-lg text-center text-gray-500 mb-1">Skriv efter:</div>
                {renderLine(true)}
                {/* Övningsrader */}
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    {renderLine()}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fria skrivningsrader */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-orange-700 flex items-center">
          📝 Fria skrivningsrader för ord och meningar {getRandomEmoji()}
        </h2>
        <div className="bg-orange-50 p-4 rounded-lg border-2 border-dashed border-orange-300">
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                {renderLine()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips och uppmuntran */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-pink-50 p-3 rounded-lg border-2 border-dashed border-pink-300">
          <h3 className="text-lg font-bold mb-2 text-pink-700">🎯 Kom ihåg:</h3>
          <ul className="text-sm space-y-1">
            {improvements.slice(0, 3).map((improvement, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border-2 border-dashed border-blue-300">
          <h3 className="text-lg font-bold mb-2 text-blue-700">💡 Smarta tips:</h3>
          <ul className="text-sm space-y-1">
            {tips.slice(0, 3).map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">🌟</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Uppmuntrande meddelande */}
      <div className="text-center bg-gradient-to-r from-yellow-100 to-green-100 p-3 rounded-lg border-2 border-dashed border-yellow-400">
        <p className="text-lg font-bold text-purple-800">
          🎉 Du kommer bli en handstilsstjärna! Fortsätt öva och ha kul! 🚀✨
        </p>
        <div className="flex justify-center space-x-4 mt-2">
          <span>📚</span>
          <span>✏️</span>
          <span>🌈</span>
          <span>⭐</span>
          <span>🎨</span>
        </div>
      </div>

      {/* Footer med motiverande ord */}
      <div className="absolute bottom-4 left-6 right-6 text-center text-xs text-gray-600">
        <p>Genererat av PenPal AI - Din vänliga handstilscoach! 🤖💙</p>
      </div>
    </div>
  );
};

export default HandwritingExerciseSheet;