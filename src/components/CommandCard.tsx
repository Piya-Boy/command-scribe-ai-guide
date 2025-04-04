
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Command } from "@/types/command";

// Make examples optional in the props to match how it's being used
interface CommandProps {
  id?: string;
  name: string;
  description: string;
  syntax: string;
  platform: "linux" | "windows" | "both";
  examples?: string[];
}

const CommandCard = ({ id, name, description, syntax, platform, examples = [] }: CommandProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  
  const platformColor = {
    linux: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    windows: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    both: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  };

  const handleSaveCommand = async () => {
    setIsSaving(true);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!sessionData.session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save commands",
          variant: "destructive",
        });
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
      
      const { error } = await supabase
        .from('bookmarks')
        .insert([{ command_id: id, user_id: userId }]);
      
      if (error) {
        if (error.code === '23505') { // Unique violation code
          toast({
            title: "Already Saved",
            description: "This command is already in your bookmarks",
          });
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
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-mono">{name}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge className={`${platformColor[platform]}`}>
            {platform === "both" ? "Linux & Windows" : platform === "linux" ? "Linux" : "Windows"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Syntax:</p>
          <pre className="bg-muted p-2 rounded font-mono text-sm overflow-x-auto">
            <code>{syntax}</code>
          </pre>
        </div>

        {examples.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Examples:</p>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <pre key={index} className="bg-muted p-2 rounded font-mono text-sm overflow-x-auto">
                  <code>{example}</code>
                </pre>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="ghost" 
          className="ml-auto" 
          size="sm"
          onClick={handleSaveCommand}
          disabled={isSaving || isSaved || !id}
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Saved
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CommandCard;
