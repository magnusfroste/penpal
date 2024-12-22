import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-8 py-4 border-t">
      <div className="container flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <a 
          href="https://www.froste.eu" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          froste.eu
          <ExternalLink className="h-3 w-3" />
        </a>
        <span>|</span>
        <span>© {new Date().getFullYear()} Magnus Froste</span>
      </div>
    </footer>
  );
};

export default Footer;