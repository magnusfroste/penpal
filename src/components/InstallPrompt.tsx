import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Share, Plus, Smartphone } from "lucide-react";

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    
    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const wasPromptDismissed = localStorage.getItem('installPromptDismissed');
    
    // Show prompt only on iOS, not in standalone mode, and if not previously dismissed
    if (isIOSDevice && !isStandalone && !wasPromptDismissed) {
      // Show after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt || !isIOS) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-blue-50 border-blue-200 shadow-lg">
      <div className="flex items-start gap-3">
        <Smartphone className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-2">
            Installera Penpal Buddy på din iPhone
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>Få snabb åtkomst direkt från hemskärmen:</p>
            <div className="flex items-center gap-2">
              <span>1. Tryck på</span>
              <Share className="h-4 w-4" />
              <span>(Dela) längst ner</span>
            </div>
            <div className="flex items-center gap-2">
              <span>2. Välj</span>
              <Plus className="h-4 w-4" />
              <span>"Lägg till på hemskärmen"</span>
            </div>
            <p>3. Tryck "Lägg till" för att installera</p>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="p-1 h-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default InstallPrompt;