
import { Terminal } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-center gap-4 px-4 md:px-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium">CommandScribe © 2025</p>
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <a className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </a>
          <a className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </a>
          <a className="text-xs hover:underline underline-offset-4" href="#">
            About
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
