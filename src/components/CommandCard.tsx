import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Check, Trash2, Edit, Copy, Tag as TagIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Command} from "@/types/command";
import { FaBookmark } from "react-icons/fa";
import AuthRequiredDialog from "./AuthRequiredDialog";
import { TranslationButton } from "./TranslationButton";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CommandDetailsDialog from "./CommandDetailsDialog";

// Make examples optional in the props to match how it's being used
interface CommandProps {
  id?: string;
  name: string;
  description: string;
  syntax: string;
  platform: "linux" | "windows" | "both";
  examples?: string[];
  category?: string;
  tags?: string[];
  onDelete?: () => void;
  onEdit?: () => void;
  isSample?: boolean;
  showEditDelete?: boolean;
  isPublished?: boolean;
  user_id?: string;
}

const CommandCard = ({ 
  id, 
  name, 
  description, 
  syntax, 
  platform, 
  examples = [], 
  category,
  onDelete, 
  onEdit,
  isSample = false,
  showEditDelete = false,
  isPublished = false,
  user_id
}: CommandProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [copiedExampleIndex, setCopiedExampleIndex] = useState<number | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | undefined>(undefined);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [localIsPublished, setLocalIsPublished] = useState(isPublished);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();
  
  
  const platformColor = {
    linux: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    windows: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    both: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  };

  const publishedColor = {
    unpublished: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    published: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  };

  // Add effect to get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Check if the command is already bookmarked when the component mounts
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!id) return;
      
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) return;

        // Skip bookmark check for sample commands (non-UUID IDs)
        if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          setIsSaved(false);
          return;
        }

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
    if (id && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
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
    if (!id) return;

    const subscription = supabase
      .channel(`command-${id}-changes`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'commands',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedCommand = payload.new as Command;
            // Update local state
            setLocalIsPublished(updatedCommand.isPublished);
            toast({
              title: "Command Updated",
              description: `Command is now ${updatedCommand.isPublished ? 'published' : 'unpublished'}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, toast]);

  // Update local state when prop changes
  useEffect(() => {
    setLocalIsPublished(isPublished);
  }, [isPublished]);

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

  const handleCopyExample = async (example: string, index: number) => {
    try {
      await navigator.clipboard.writeText(example);
      setCopiedExampleIndex(index);
      toast({
        title: "Copied!",
        description: "Example copied to clipboard",
      });
      setTimeout(() => setCopiedExampleIndex(null), 2000);
    } catch (error) {
      console.error("Failed to copy example:", error);
      toast({
        title: "Error",
        description: "Failed to copy example to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleTranslationComplete = (translatedText: string | undefined) => {
    setTranslatedDescription(translatedText);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowDetailsDialog(true)}
        className="cursor-pointer"
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{name}</CardTitle>
                <CardDescription className="mt-1">
                  {translatedDescription || description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={platformColor[platform]}>
                  {platform}
                </Badge>
                {!isSample && currentUserId && user_id && currentUserId === user_id && (
                  <Badge className={publishedColor[localIsPublished ? "published" : "unpublished"]}>
                    {localIsPublished ? "Published" : "Unpublished"}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="bg-muted p-3 rounded-md mb-4">
              <code className="text-sm">{syntax}</code>
            </div>
            
            {examples.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Examples:</h4>
                <div className="space-y-2">
                  {examples.map((example, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between bg-muted p-2 rounded-md"
                    >
                      <code className="text-sm">{example}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyExample(example, index);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        {copiedExampleIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TranslationButton 
                  text={description} 
                  onTranslationComplete={handleTranslationComplete}
                  messageId={`command-${id || 'new'}`}
                  isTranslated={!!translatedDescription}
                />
              </div>
              <div className="flex items-center gap-2">
                {!isSample && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveCommand();
                      }}
                      disabled={isSaving}
                      className="h-8 w-8 p-0"
                    >
                      {isSaved ? (
                        <FaBookmark className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                )}
                
                {showEditDelete && (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.();
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.();
                        }}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />

      <CommandDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        name={name}
        description={description}
        syntax={syntax}
        platform={platform}
        examples={examples}
        isSample={isSample}
        showEditDelete={showEditDelete}
        isPublished={localIsPublished}
        isSaved={isSaved}
        isSaving={isSaving}
        translatedDescription={translatedDescription}
        onSave={handleSaveCommand}
        onEdit={onEdit}
        onDelete={onDelete}
        onCopyExample={handleCopyExample}
        onTranslationComplete={handleTranslationComplete}
        copiedExampleIndex={copiedExampleIndex}
        commandId={id}
      />
    </>
  );
};

export default CommandCard;
