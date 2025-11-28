import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import HandwritingExerciseSheet from './HandwritingExerciseSheet';
import AnalysisLoading from './analysis/AnalysisLoading';
import AnalysisContent from './analysis/AnalysisContent';

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
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(
        <HandwritingExerciseSheet
          practiceLetters={message.analysis?.practiceLetters || []}
          improvements={message.analysis?.improvements || []}
          tips={message.analysis?.tips || []}
        />
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('handskriftsövning.pdf');

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

  if (!message.analysis) {
    return <AnalysisLoading image={message.image} />;
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <AnalysisContent analysis={message.analysis} image={message.image} />
      
      <div className="flex justify-center px-2">
        <Button
          onClick={handleDownloadPDF}
          className="gap-2 bg-gradient-to-r from-primary/90 to-blue-600/90 hover:from-primary hover:to-blue-600 text-white shadow-md transition-all duration-300 w-full sm:w-auto text-sm sm:text-base"
          size="lg"
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
    </div>
  );
};

export default AnalysisResponse;