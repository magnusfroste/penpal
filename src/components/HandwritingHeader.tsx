import { PenLine } from 'lucide-react';

const HandwritingHeader = () => {
  return (
    <div className="text-center py-6 sm:py-10">
      <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
        <PenLine className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          PenPal
        </h1>
      </div>
      
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground mb-3 sm:mb-4 px-4">
        Din handstils superhjälte! 🦸‍♂️✨
      </h2>
      
      <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-md mx-auto px-4 leading-relaxed">
        Fota din handstil och upptäck magiska tips som gör ditt skrivande ännu vackrare
      </p>
    </div>
  );
};

export default HandwritingHeader;
