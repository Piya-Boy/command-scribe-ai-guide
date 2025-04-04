
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { Command } from "@/types/command";

interface NewCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (command: Command) => void;
}

const NewCommandDialog = ({ open, onOpenChange, onSubmit }: NewCommandDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [syntax, setSyntax] = useState("");
  const [platform, setPlatform] = useState<"linux" | "windows" | "both">("linux");
  const [category, setCategory] = useState("");
  const [examples, setExamples] = useState<string[]>([""]);

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
    // Filter out empty examples
    const filteredExamples = examples.filter(example => example.trim() !== "");
    
    const newCommand: Command = {
      id: crypto.randomUUID(), // This will be overwritten by the database
      name,
      description,
      syntax,
      platform,
      examples: filteredExamples,
      // Removing the category property as it's not in the Command type
    };
    
    onSubmit(newCommand);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSyntax("");
    setPlatform("linux");
    setCategory("");
    setExamples([""]);
  };

  const isFormValid = name.trim() !== "" && 
                      description.trim() !== "" && 
                      syntax.trim() !== "" && 
                      examples.some(example => example.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Command</DialogTitle>
        </DialogHeader>
        
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
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g., Search for patterns in files" 
              className="col-span-3" 
            />
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
            <Label htmlFor="category" className="text-right">Category</Label>
            <Input 
              id="category" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              placeholder="e.g., file, network, process" 
              className="col-span-3" 
            />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
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
            Add Command
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewCommandDialog;
