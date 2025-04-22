import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";

interface ErrorPageProps {
  code?: "404" | "500";
  message?: string;
}

const ErrorPage = ({ code = "404", message }: ErrorPageProps) => {
  const location = useLocation();
  const [displayedCommand, setDisplayedCommand] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const errorMessages = {
    "404": {
      title: "404 - Command Not Found",
      description: "The command or page you're looking for doesn't exist or has been moved.",
      command: `command '${location.pathname}' not found`
    },
    "500": {
      title: "500 - Internal Server Error",
      description: "Something went wrong on our end. Our team has been notified.",
      command: `internal server error at '${location.pathname}'`
    }
  };

  const { title, description, command } = errorMessages[code];

  useEffect(() => {
    console.error(
      `${code} Error: User encountered an error at:`,
      location.pathname
    );
  }, [location.pathname, code]);

  useEffect(() => {
    if (!isDeleting && currentIndex < command.length) {
      const timer = setTimeout(() => {
        setDisplayedCommand(prev => prev + command[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);

      return () => clearTimeout(timer);
    } else if (!isDeleting && currentIndex === command.length) {
      const pauseTimer = setTimeout(() => {
        setIsDeleting(true);
      }, 1000);

      return () => clearTimeout(pauseTimer);
    } else if (isDeleting && displayedCommand.length > 0) {
      const timer = setTimeout(() => {
        setDisplayedCommand(prev => prev.slice(0, -1));
      }, 80);

      return () => clearTimeout(timer);
    } else if (isDeleting && displayedCommand.length === 0) {
      setIsDeleting(false);
      setCurrentIndex(0);
    }
  }, [currentIndex, command, isDeleting, displayedCommand]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="text-center px-4">
          <motion.div 
            className="mb-6 flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20 
            }}
          >
            <div className="bg-primary/10 p-3 rounded-full">
              <Terminal className="h-12 w-12 text-primary" />
            </div>
          </motion.div>
          <motion.h1 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {title}
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {message || description}
          </motion.p>
          <motion.pre 
            className="bg-muted p-4 mb-8 rounded-lg inline-block font-mono"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <code>Error: {displayedCommand}</code>
          </motion.pre>
          <motion.div 
            className="space-x-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Link to="/">
              <Button>Return to Home</Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ErrorPage; 