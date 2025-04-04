
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="text-center px-4">
          <div className="mb-6 flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Terminal className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">404 - Command Not Found</h1>
          <p className="text-xl text-muted-foreground mb-6">
            The command or page you're looking for doesn't exist or has been moved.
          </p>
          <pre className="bg-muted p-4 mb-8 rounded-lg inline-block font-mono">
            <code>Error: command '{location.pathname}' not found</code>
          </pre>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
