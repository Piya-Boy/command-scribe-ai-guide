
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import { Terminal } from "lucide-react";

const Navbar = () => {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">CommandScribe</span>
        </div>
        
        <nav className="hidden md:flex gap-6">
          <a className="text-sm font-medium hover:underline" href="/">
            Home
          </a>
          <a className="text-sm font-medium hover:underline" href="/commands">
            Commands
          </a>
          <a className="text-sm font-medium hover:underline" href="/ai-assistant">
            AI Assistant
          </a>
        </nav>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm">Sign In</Button>
          <Button size="sm">Sign Up</Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
