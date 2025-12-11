import { Camera, Sparkles, FileText } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Camera,
      title: "Ta foto",
      description: "Fotografera din handstil"
    },
    {
      icon: Sparkles,
      title: "AI analyserar",
      description: "PenPal ger dig feedback"
    },
    {
      icon: FileText,
      title: "Öva",
      description: "Ladda ner övningsblad"
    }
  ];

  return (
    <div className="py-6 sm:py-8">
      <h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
        Så fungerar det
      </h2>
      
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-center">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 sm:mb-3">
                <step.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-xs sm:text-sm">{step.title}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground max-w-[80px] sm:max-w-[100px]">
                {step.description}
              </p>
            </div>
            
            {index < steps.length - 1 && (
              <div className="mx-2 sm:mx-4 text-muted-foreground/50 text-lg sm:text-xl">
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
