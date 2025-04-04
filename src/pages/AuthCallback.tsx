
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // The hash contains the access token
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error);
          setError(error.message);
          toast({
            title: "Authentication failed",
            description: error.message,
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth', { replace: true }), 3000);
          return;
        }
        
        if (data?.session) {
          // Successfully logged in, redirect to the home page
          navigate('/', { replace: true });
        } else {
          // No session, redirect to auth page
          setError("No session found");
          toast({
            title: "Authentication incomplete",
            description: "Please try signing in again.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth', { replace: true }), 3000);
        }
      } catch (err) {
        console.error('Error during auth callback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        toast({
          title: "Authentication error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/auth', { replace: true }), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      {error ? (
        <div className="flex flex-col items-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-center text-destructive">Authentication Error</p>
          <p className="max-w-md text-center text-sm text-muted-foreground">{error}</p>
          <p className="text-center text-sm">Redirecting to login page...</p>
        </div>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-center text-muted-foreground">Authenticating...</p>
        </>
      )}
    </div>
  );
};

export default AuthCallback;
