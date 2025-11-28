import { PenLine } from 'lucide-react';

const HandwritingHeader = () => {
  return (
    <div className="text-center mb-6 sm:mb-8">
      <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
        <PenLine className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-bounce" />
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          PenPal
        </h1>
      </div>
      <p className="text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto text-sm sm:text-lg px-2">
        <span className="font-semibold text-primary">Hej min glada penn-kompis! 🌟</span>
        <br />
        <span className="hidden sm:inline">Nu ska vi ha kul tillsammans! ✨ Visa mig dina finaste krumelurer - 
        jag är <span className="italic">super</span>-nyfiken på att se hur du skriver idag!</span>
        <span className="sm:hidden">Visa mig dina finaste krumelurer! ✨</span>
        <br />
        <span className="font-medium text-blue-600">Är du redo för ett handskriftsäventyr? 🎨✏️</span>
      </p>
    </div>
  );
};

export default HandwritingHeader;