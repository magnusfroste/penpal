import { Button } from "@/components/ui/button";
import { Loader2, ImagePlus, Upload } from "lucide-react";

interface UploadButtonsProps {
  isLoading: boolean;
  isInitializing: boolean;
  handleCameraClick: () => void;
  handleFileClick: () => void;
}

const UploadButtons = ({ isLoading, isInitializing, handleCameraClick, handleFileClick }: UploadButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
      <Button
        onClick={handleCameraClick}
        disabled={isLoading || isInitializing}
        className="w-full sm:w-auto bg-gradient-to-r from-primary/90 to-blue-600/90 hover:from-primary hover:to-blue-600 text-white shadow-md transition-all duration-300 gap-2"
        size="lg"
      >
        {isInitializing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ImagePlus className="h-5 w-5" />
        )}
        {isInitializing ? 'Initierar...' : 'Ta ett foto'}
      </Button>

      <Button
        onClick={handleFileClick}
        disabled={isLoading || isInitializing}
        variant="outline"
        className="w-full sm:w-auto border-primary/20 hover:border-primary/40 transition-all duration-300 gap-2"
        size="lg"
      >
        <Upload className="h-5 w-5" />
        Välj en bild
      </Button>
    </div>
  );
};

export default UploadButtons;