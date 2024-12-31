import { PenLine } from 'lucide-react';

const HandwritingHeader = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-2 mb-3">
        <PenLine className="h-8 w-8 text-primary animate-bounce" />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          PenPal
        </h1>
      </div>
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg">
        <span className="font-semibold text-primary">Hej min glada penkompis! 🌟</span>
        <br />
        Nu ska vi ha kul tillsammans! ✨ Visa mig dina finaste krumelurer - 
        jag är <span className="italic">super</span>-nyfiken på att se hur du skriver idag! 
        <br />
        <span className="font-medium text-blue-600">Är du redo för ett handskriftsäventyr? 🎨✏️</span>
      </p>
    </div>
  );
};

export default HandwritingHeader;