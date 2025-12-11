import { Button } from "@/components/ui/button";
import { Loader2, Camera, Upload } from "lucide-react";

interface UploadButtonsProps {
  isLoading: boolean;
  isInitializing: boolean;
  handleCameraClick: () => void;
  handleFileClick: () => void;
}

const UploadButtons = ({ isLoading, isInitializing, handleCameraClick, handleFileClick }: UploadButtonsProps) => {
  return (
    <div className="py-6 sm:py-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto">
        <Button
          onClick={handleCameraClick}
          disabled={isLoading || isInitializing}
          size="lg"
          className="h-20 sm:h-24 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col gap-1 sm:gap-2"
        >
          {isInitializing ? (
            <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin" />
          ) : isLoading ? (
            <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin" />
          ) : (
            <Camera className="h-7 w-7 sm:h-8 sm:w-8" />
          )}
          <span>{isInitializing ? 'Initierar...' : 'Ta foto'}</span>
        </Button>
        
        <Button
          onClick={handleFileClick}
          disabled={isLoading || isInitializing}
          variant="outline"
          size="lg"
          className="h-20 sm:h-24 text-sm sm:text-base font-semibold border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 flex flex-col gap-1 sm:gap-2"
        >
          <Upload className="h-7 w-7 sm:h-8 sm:w-8" />
          <span>Ladda upp</span>
        </Button>
      </div>
    </div>
  );
};

export default UploadButtons;
