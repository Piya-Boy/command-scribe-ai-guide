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
import errorMonitoring from './lib/errorMonitoring';
import performanceMonitoring from './lib/performanceMonitoring';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function ErrorFallback({ error }: { error: Error }) {
  errorMonitoring.logError(error);
  return <ErrorPage code="500" message={error.message} />;
}

const App = () => {
  useEffect(() => {
    // Initialize monitoring
    errorMonitoring.init();
    performanceMonitoring.init();

    // Track initial load time
    const startTime = performance.now();
    performanceMonitoring.trackLoadTime();

    return () => {
      // Cleanup if needed
    };
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
