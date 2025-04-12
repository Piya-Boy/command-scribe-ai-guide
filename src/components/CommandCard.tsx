import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Check, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Command } from "@/types/command";
import { FaBookmark } from "react-icons/fa";
import AuthRequiredDialog from "./AuthRequiredDialog";

// Make examples optional in the props to match how it's being used
interface CommandProps {
  id?: string;
  name: string;
  description: string;
  syntax: string;
  platform: "linux" | "windows" | "both";
  examples?: string[];
  onDelete?: () => void;
  onEdit?: () => void;
  isSample?: boolean;
  showEditDelete?: boolean;
}

const CommandCard = ({ 
  id, 
  name, 
  description, 
  syntax, 
  platform, 
  examples = [], 
  onDelete, 
  onEdit,
  isSample = false,
  showEditDelete = false 
}: CommandProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { toast } = useToast();
  
  
  const platformColor = {
    linux: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    windows: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    both: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  };

  // Check if the command is already bookmarked when the component mounts
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!id) return;
      
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) return;

        const { data, error } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('command_id', id)
          .eq('user_id', sessionData.session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error checking bookmark status:', error);
          return;
        }

        setIsSaved(!!data);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };

    checkBookmarkStatus();

    // Set up real-time subscription for bookmark changes
    if (id) {
      const subscription = supabase
        .channel('bookmark-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `command_id=eq.${id}`
          },
          async (payload) => {
            // Check if the change is relevant to the current user
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) return;

            if (payload.eventType === 'INSERT' && payload.new.user_id === sessionData.session.user.id) {
              setIsSaved(true);
            } else if (payload.eventType === 'DELETE' && payload.old.user_id === sessionData.session.user.id) {
              setIsSaved(false);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id]);

  // Set up real-time subscription for command changes
  useEffect(() => {
    if (id) {
      const subscription = supabase
        .channel('command-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'commands',
            filter: `id=eq.${id}`
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              const updatedCommand = payload.new as Command;
              // Update the component's state with the new command data
              // Note: In a real implementation, you would need to lift this state up
              // to the parent component to update the command data
              toast({
                title: "Command Updated",
                description: "The command has been updated by another user.",
              });
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id, toast]);

  const handleSaveCommand = async () => {
    setIsSaving(true);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!sessionData.session) {
        setShowAuthDialog(true);
        return;
      }
      
      if (!id) {
        toast({
          title: "Error",
          description: "Command ID is required to save",
          variant: "destructive",
        });
        return;
      }

      const userId = sessionData.session.user.id;
      
      if (isSaved) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('command_id', id)
          .eq('user_id', userId);
        
        if (error) throw error;
        
        setIsSaved(false);
        toast({
          title: "Bookmark Removed",
          description: "Command removed from your bookmarks",
        });
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert([{ command_id: id, user_id: userId }]);
        
        if (error) {
          if (error.code === '23505') { // Unique violation code
            toast({
              title: "Already Saved",
              description: "This command is already in your bookmarks",
            });
            setIsSaved(true); // Update state to reflect reality
          } else {
            throw error;
          }
        } else {
          setIsSaved(true);
          toast({
            title: "Command Saved",
            description: "Added to your bookmarks",
          });
        }
      }
    } catch (error) {
      console.error("Error saving command:", error);
      toast({
        title: "Error",
        description: "Failed to save command",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-mono break-words">{name}</CardTitle>
              <CardDescription className="mt-1 text-sm sm:text-base break-words">{description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${platformColor[platform]} self-start text-xs sm:text-sm`}>
                {platform === "both" ? "Linux & Windows" : platform === "linux" ? "Linux" : "Windows"}
              </Badge>
              {showEditDelete && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.()}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete?.()}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div>
            <p className="text-xs sm:text-sm font-medium mb-1">Syntax:</p>
            <pre className="bg-muted p-2 rounded font-mono text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap break-words">
              <code>{syntax}</code>
            </pre>
          </div>

          {examples.length > 0 && (
            <div>
              <p className="text-xs sm:text-sm font-medium mb-1">Examples:</p>
              <div className="space-y-2">
                {examples.map((example, index) => (
                  <pre key={index} className="bg-muted p-2 rounded font-mono text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap break-words">
                    <code>{example}</code>
                  </pre>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!isSample && (
            <Button 
              variant="ghost" 
              className="ml-auto w-full sm:w-auto text-xs sm:text-sm"
              size="sm"
              onClick={handleSaveCommand}
              disabled={isSaving || !id}
            >
              {isSaved ? (
                <>
                  <FaBookmark className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      <AuthRequiredDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
      />
    </>
  );
};

export default CommandCard;
