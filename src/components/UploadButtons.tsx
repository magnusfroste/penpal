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
    <div className="space-y-4 sm:space-y-6 text-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
        <Button
          onClick={handleCameraClick}
          disabled={isLoading || isInitializing}
          className="h-16 sm:h-20 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isInitializing ? (
            <Loader2 className="mr-2 h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
          ) : isLoading ? (
            <Loader2 className="mr-2 h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
          ) : (
            <Camera className="mr-2 h-6 w-6 sm:h-8 sm:w-8" />
          )}
          {isInitializing ? 'Initierar...' : 'Ta foto'}
        </Button>
        
        <Button
          onClick={handleFileClick}
          disabled={isLoading || isInitializing}
          variant="outline"
          className="h-16 sm:h-20 text-base sm:text-lg font-semibold border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
        >
          <Upload className="mr-2 h-6 w-6 sm:h-8 sm:w-8" />
          Ladda upp
        </Button>
      </div>
    </div>
  );
};

export default UploadButtons;