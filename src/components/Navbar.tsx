
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { Terminal } from "lucide-react";

const Navbar = () => {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          <Link to="/" className="text-xl font-bold">CommandScribe</Link>
        </div>
        
        <nav className="hidden md:flex gap-6">
          <Link className="text-sm font-medium hover:underline" to="/">
            Home
          </Link>
          <Link className="text-sm font-medium hover:underline" to="/commands">
            Commands
          </Link>
          <Link className="text-sm font-medium hover:underline" to="/ai-assistant">
            AI Assistant
          </Link>
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
