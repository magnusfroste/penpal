import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import HandwritingExerciseSheet from './HandwritingExerciseSheet';

interface ExerciseSheetPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practiceLetters: string[];
  improvements: string[];
  tips: string[];
  onDownload: () => void;
  isDownloading: boolean;
}

const ExerciseSheetPreview = ({
  open,
  onOpenChange,
  practiceLetters,
  improvements,
  tips,
  onDownload,
  isDownloading
}: ExerciseSheetPreviewProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Förhandsvisning av övningsblad (A4)
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4">
          <div className="flex justify-center">
            <div 
              className="bg-white shadow-lg border border-border/50 origin-top"
              style={{
                width: '210mm',
                minHeight: '297mm',
                transform: 'scale(0.5)',
                transformOrigin: 'top center',
                marginBottom: '-148.5mm'
              }}
            >
              <HandwritingExerciseSheet
                practiceLetters={practiceLetters}
                improvements={improvements}
                tips={tips}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t flex-shrink-0 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Stäng
          </Button>
          <Button
            onClick={onDownload}
            disabled={isDownloading}
            className="gap-2 bg-gradient-to-r from-primary/90 to-blue-600/90 hover:from-primary hover:to-blue-600"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Skapar PDF...' : 'Ladda ner PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseSheetPreview;
