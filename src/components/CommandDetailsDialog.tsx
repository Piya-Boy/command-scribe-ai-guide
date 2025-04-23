import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Check, Trash2, Edit, Copy, X } from "lucide-react";
import { FaBookmark } from "react-icons/fa";
import { TranslationButton } from "./TranslationButton";
import { motion } from "framer-motion";

interface CommandDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  description: string;
  syntax: string;
  platform: "linux" | "windows" | "both";
  examples: string[];
  isSample?: boolean;
  showEditDelete?: boolean;
  isPublished?: boolean;
  isSaved?: boolean;
  isSaving?: boolean;
  translatedDescription?: string;
  onSave?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopyExample?: (example: string, index: number) => void;
  onTranslationComplete?: (translatedText: string | undefined) => void;
  copiedExampleIndex: number | null;
  commandId?: string;
}

const platformColor = {
  linux: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  windows: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  both: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
};

const publishedColor = {
  unpublished: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  published: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
};

const CommandDetailsDialog = ({
  open,
  onOpenChange,
  name,
  description,
  syntax,
  platform,
  examples,
  isSample = false,
  showEditDelete = false,
  isPublished = false,
  isSaved = false,
  isSaving = false,
  translatedDescription,
  onSave,
  onEdit,
  onDelete,
  onCopyExample,
  onTranslationComplete,
  copiedExampleIndex,
  commandId
}: CommandDetailsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
            <div className="flex mt-2 items-center justify-between">
          <DialogTitle className="text-2xl">{name}</DialogTitle>
          <div className="flex gap-2">
            <Badge className={platformColor[platform]}>
              {platform}
            </Badge>
            {!isSample && (
              <Badge className={publishedColor[isPublished ? "published" : "unpublished"]}>
                {isPublished ? "Published" : "Unpublished"}
              </Badge>
            )}
          </div>
            </div>
          <DialogDescription className="text-base">
            {translatedDescription || description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">

            <h4 className="text-sm font-medium mb-2">Syntax:</h4>
          <div className="bg-muted p-4 rounded-md">
            <code className="text-sm">{syntax}</code>
          </div>

          {examples.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Examples:</h4>
              <div className="space-y-2">
                {examples.map((example, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between bg-muted p-3 rounded-md"
                  >
                    <code className="text-sm">{example}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCopyExample?.(example, index)}
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

          <div className="flex justify-between items-center pt-4">
            <div className="flex items-center gap-2">
              <TranslationButton 
                text={description} 
                onTranslationComplete={onTranslationComplete}
                messageId={`command-${commandId || 'new'}`}
                isTranslated={!!translatedDescription}
              />
            </div>
            <div className="flex items-center gap-2">
              {!isSample && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving}
                  className="h-8 w-8 p-0"
                >
                  {isSaved ? (
                    <FaBookmark className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {showEditDelete && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandDetailsDialog; 