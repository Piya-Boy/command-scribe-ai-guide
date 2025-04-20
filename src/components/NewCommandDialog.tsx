import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, LogIn } from "lucide-react";
import type { Command } from "@/types/command";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface NewCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (command: Command, type: string) => void;
  initialData?: Partial<Command>;
  type?: string;
}

const NewCommandDialog = ({ open, onOpenChange, onSubmit, initialData, type = "add" }: NewCommandDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [syntax, setSyntax] = useState("");
  const [platform, setPlatform] = useState<"linux" | "windows" | "both">("linux");
  const [category, setCategory] = useState("");
  const [examples, setExamples] = useState<string[]>([""]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // console.log(type);
  }, [type]);

  // Initialize form with initialData when it changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setSyntax(initialData.syntax || "");
      setPlatform(initialData.platform || "linux");
      setCategory(initialData.category || "");
      setExamples(initialData.examples && initialData.examples.length > 0 
        ? initialData.examples 
        : [""]);
    } else {
      // Reset form when adding new command
      setName("");
      setDescription("");
      setSyntax("");
      setPlatform("linux");
      setExamples([""]);
    }
  }, [initialData]);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    
    checkAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAddExample = () => {
    setExamples([...examples, ""]);
  };

  const handleExampleChange = (index: number, value: string) => {
    const newExamples = [...examples];
    newExamples[index] = value;
    setExamples(newExamples);
  };

  const handleRemoveExample = (index: number) => {
    if (examples.length > 1) {
      const newExamples = [...examples];
      newExamples.splice(index, 1);
      setExamples(newExamples);
    }
  };

  const handleSubmit = () => {
    if (!isFormValid) return;

    const command: Command = {
      id: initialData?.id || "",
      name,
      description,
      syntax,
      platform,
      examples: examples.filter(example => example.trim() !== ""),
      user_id: initialData?.user_id || "",
      created_at: initialData?.created_at || new Date().toISOString()
    };

    onSubmit(command, type);
    onOpenChange(false);
  };

  const resetForm = () => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setSyntax(initialData.syntax || "");
      setPlatform(initialData.platform || "linux");
      setExamples(initialData.examples && initialData.examples.length > 0 
        ? initialData.examples 
        : [""]);
    } else {
      setName("");
      setDescription("");
      setSyntax("");
      setPlatform("linux");
      setCategory("");
      setExamples([""]);
    }
  };

  const isFormValid = name.trim() !== "" && 
                      description.trim() !== "" && 
                      syntax.trim() !== "" && 
                      examples.some(example => example.trim() !== "");

  const handleLoginClick = () => {
    onOpenChange(false);
    window.location.href = "/auth";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{type === "add" ? "Add New Command" : "Edit Command"}</DialogTitle>
        </DialogHeader>
        
        {!isLoggedIn ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Authentication Required</h3>
              <p className="text-muted-foreground">
                You need to be signed in to add commands to the library.
              </p>
            </div>
            <Button onClick={handleLoginClick}>
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g., grep" 
                  className="col-span-3" 
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <div className="col-span-3">
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="e.g., Search for patterns in files" 
                    className="mb-2" 
                  />
                  {description && (
                    <div className="mt-2 p-4 bg-muted rounded-md">
                      <ReactMarkdown>{description}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="syntax" className="text-right">Syntax</Label>
                <Input 
                  id="syntax" 
                  value={syntax} 
                  onChange={(e) => setSyntax(e.target.value)} 
                  placeholder="e.g., grep [options] pattern [file...]" 
                  className="col-span-3" 
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="platform" className="text-right">Platform</Label>
                <Select value={platform} onValueChange={(value: "linux" | "windows" | "both") => setPlatform(value)}>
                  <SelectTrigger id="platform" className="col-span-3">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linux">Linux</SelectItem>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right pt-2">Examples</Label>
                <div className="col-span-3 space-y-2">
                  {examples.map((example, index) => (
                    <div key={index} className="flex gap-2">
                      <Input 
                        value={example} 
                        onChange={(e) => handleExampleChange(index, e.target.value)} 
                        placeholder="e.g., grep -r 'pattern' /path" 
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveExample(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddExample}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Example
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!isFormValid}>
                {type === "add" ? "Add Command" : "Save Changes"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewCommandDialog;
