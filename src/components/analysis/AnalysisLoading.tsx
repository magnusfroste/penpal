import React from 'react';
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AnalysisLoadingProps {
  image?: string;
}

const AnalysisLoading = ({ image }: AnalysisLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">AI:n analyserar din handstil...</p>
      {image && (
        <Card className="p-4 mt-4">
          <img
            src={image}
            alt="Handskriftsprov"
            className="rounded-lg shadow-lg mx-auto max-h-[300px] object-contain"
          />
        </Card>
      )}
    </div>
  );
};

export default AnalysisLoading;