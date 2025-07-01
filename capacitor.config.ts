import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.aef9144cb2bc4877b503f738e0297500',
  appName: 'penpal-buddy',
  webDir: 'dist',
  server: {
    url: 'https://aef9144c-b2bc-4877-b503-f738e0297500.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;