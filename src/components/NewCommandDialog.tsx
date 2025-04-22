import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Plus, LogIn } from "lucide-react";
import type { Command } from "@/types/command";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const dialogVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.3
    }
  },
  exit: { 
    opacity: 0, 
    y: 50,
    transition: {
      duration: 0.2
    }
  }
};

const formItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.1 + i * 0.1,
      duration: 0.3
    }
  })
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

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
  const [isPublished, setIsPublished] = useState(false);
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
      setIsPublished(initialData.isPublished || false);
    } else {
      // Reset form when adding new command
      setName("");
      setDescription("");
      setSyntax("");
      setPlatform("linux");
      setExamples([""]);
      setIsPublished(false);
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

    console.log('Current isPublished state:', isPublished);

    const command: Command = {
      id: initialData?.id || "",
      name,
      description,
      syntax,
      platform,
      examples: examples.filter(example => example.trim() !== ""),
      category,
      user_id: initialData?.user_id || "",
      created_at: initialData?.created_at || new Date().toISOString(),
      isPublished
    };

    console.log('Submitting command:', command);
    onSubmit(command, type);
    onOpenChange(false);
  };

  // Add logging when isPublished changes
  useEffect(() => {
    console.log('isPublished changed:', isPublished);
  }, [isPublished]);

  // Add logging when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log('Initializing form with data:', initialData);
      setIsPublished(initialData.isPublished || false);
    }
  }, [initialData]);

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
      <DialogContent className="sm:max-w-[600px]">
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={dialogVariants}
        >
          <DialogHeader>
            <DialogTitle>{type === "edit" ? "Edit Command" : "Add New Command"}</DialogTitle>
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
                <motion.div 
                  variants={formItemVariants}
                  custom={0}
                  initial="hidden"
                  animate="visible"
                >
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Command name"
                  />
                </motion.div>
                
                <motion.div 
                  variants={formItemVariants}
                  custom={1}
                  initial="hidden"
                  animate="visible"
                >
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Command description"
                    rows={3}
                  />
                </motion.div>
                
                <motion.div 
                  variants={formItemVariants}
                  custom={2}
                  initial="hidden"
                  animate="visible"
                >
                  <Label htmlFor="syntax">Syntax</Label>
                  <Input
                    id="syntax"
                    value={syntax}
                    onChange={(e) => setSyntax(e.target.value)}
                    placeholder="Command syntax"
                  />
                </motion.div>
                
                <motion.div 
                  variants={formItemVariants}
                  custom={3}
                  initial="hidden"
                  animate="visible"
                >
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={platform} onValueChange={(value: "linux" | "windows" | "both") => setPlatform(value)}>
                    <SelectTrigger id="platform">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linux">Linux</SelectItem>
                      <SelectItem value="windows">Windows</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
                
                <motion.div 
                  variants={formItemVariants}
                  custom={4}
                  initial="hidden"
                  animate="visible"
                >
                  <Label>Examples</Label>
                  <AnimatePresence>
                    {examples.map((example, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-2 mb-2"
                      >
                        <Input
                          value={example}
                          onChange={(e) => handleExampleChange(index, e.target.value)}
                          placeholder={`Example ${index + 1}`}
                          className="flex-1"
                        />
                        {examples.length > 1 && (
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveExample(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
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
                  </motion.div>
                </motion.div>
                
                {isLoggedIn && (
                  <motion.div 
                    variants={formItemVariants}
                    custom={5}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center space-x-2"
                  >
                    <Switch
                      id="published"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                    <Label htmlFor="published">Publish this command</Label>
                  </motion.div>
                )}
              </div>
              
              <DialogFooter>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button onClick={handleSubmit}>
                    {type === "edit" ? "Update" : "Add"} Command
                  </Button>
                </motion.div>
              </DialogFooter>
            </>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default NewCommandDialog;
