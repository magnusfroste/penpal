import React from 'react';
import { Card } from "@/components/ui/card";
import { Check, Info, AlertTriangle, Loader2, Star, PenTool, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import HandwritingExerciseSheet from './HandwritingExerciseSheet';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";

interface Analysis {
  strengths: string[];
  improvements: string[];
  tips: string[];
  perfectLetters: string[];
  practiceLetters: string[];
}

interface AnalysisResponseProps {
  message: {
    content: string;
    image?: string;
    analysis?: Analysis;
  };
}

const AnalysisResponse = ({ message }: AnalysisResponseProps) => {
  const [isThinking, setIsThinking] = React.useState(true);
  const [showImage, setShowImage] = React.useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsThinking(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const analysis = message.analysis || {
    strengths: [],
    improvements: [],
    tips: [],
    perfectLetters: [],
    practiceLetters: []
  };

  const LetterBadge = ({ letter }: { letter: string }) => (
    <span className="inline-block px-3 py-1 m-1 text-lg font-medium rounded-full bg-background border-2">
      {letter}
    </span>
  );

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // Create a temporary container for the exercise sheet
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Create a root and render the exercise sheet
      const root = createRoot(container);
      root.render(
        <HandwritingExerciseSheet
          practiceLetters={analysis.practiceLetters}
          improvements={analysis.improvements}
          tips={analysis.tips}
        />
      );

      // Wait for the content to render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Convert the rendered content to canvas
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        logging: false,
        useCORS: true
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Download the PDF
      pdf.save('handskriftsövning.pdf');

      // Cleanup
      root.unmount();
      document.body.removeChild(container);

      toast({
        title: "PDF skapad!",
        description: "Din övning har laddats ner som PDF.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte skapa PDF-filen. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ... keep existing code (isThinking render block)

  return (
    <div className="w-full space-y-6">
      {isThinking ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">AI:n analyserar din handstil...</p>
          {message.image && (
            <Card className="p-4 mt-4">
              <img
                src={message.image}
                alt="Handskriftsprov"
                className="rounded-lg shadow-lg mx-auto max-h-[300px] object-contain"
              />
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="gap-2"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGeneratingPDF ? 'Skapar PDF...' : 'Ladda ner övningsblad'}
            </Button>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-700 mb-3">
                <Star className="h-5 w-5" />
                Bokstäver som ser bra ut
              </h3>
              <div className="flex flex-wrap">
                {analysis.perfectLetters.map((letter, index) => (
                  <LetterBadge key={index} letter={letter} />
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100">
              <div 
                role="button"
                className="cursor-pointer w-full"
                onClick={() => setShowImage(!showImage)}
              >
                <h3 className="text-lg font-semibold flex items-center gap-2 text-purple-700 mb-3">
                  <PenTool className="h-5 w-5" />
                  Bokstäver att öva på
                </h3>
              </div>
              <div className="flex flex-wrap mb-3">
                {analysis.practiceLetters.map((letter, index) => (
                  <LetterBadge key={index} letter={letter} />
                ))}
              </div>
              {showImage && message.image && (
                <div className="mt-4">
                  <img
                    src={message.image}
                    alt="Handskriftsprov"
                    className="rounded-lg shadow-lg mx-auto max-h-[300px] object-contain"
                  />
                </div>
              )}
            </Card>
          </div>

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
      )}

      <div className="hidden">
        <HandwritingExerciseSheet
          practiceLetters={analysis.practiceLetters}
          improvements={analysis.improvements}
          tips={analysis.tips}
        />
      </div>
    </div>
  );
};

export default AnalysisResponse;
