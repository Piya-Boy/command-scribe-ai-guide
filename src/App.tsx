import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Commands from "./pages/Commands";
import AIAssistant from "./pages/AIAssistant";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ErrorPage from "./pages/ErrorPage";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from 'react-error-boundary';
import { performanceMonitor } from './lib/performanceMonitor';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function ErrorFallback({ error }: { error: Error }) {
  return <ErrorPage code="500" message={error.message} />;
}

const App = () => {
  useEffect(() => {
    const startTime = performance.now();
    performanceMonitor.trackLoadTime(startTime);
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/commands" element={<Commands />} />
                <Route path="/ai-assistant" element={
                  <ProtectedRoute>
                    <AIAssistant />
                  </ProtectedRoute>
                } />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<ErrorPage code="404" />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
