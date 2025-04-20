import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { toast } from "sonner";
import { getAIResponse } from "@/lib/aiService";

interface TranslationButtonProps {
  text: string;
  messageId: string;
  onTranslationComplete: (translatedText: string | undefined) => void;
  showApiKeyDialog: () => void;
  isTranslated: boolean;
}

export const TranslationButton = ({
  text,
  messageId,
  onTranslationComplete,
  showApiKeyDialog,
  isTranslated,
}: TranslationButtonProps) => {
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslation = async () => {
    // If already translated, toggle back to original text
    if (isTranslated) {
      onTranslationComplete(undefined);
      return;
    }

    setIsTranslating(true);
    try {
      // Create a prompt for translation
      const translationPrompt = `Translate the following text to Thai. Only translate the text, do not translate any code blocks or commands. Keep the markdown formatting intact:\n\n${text}`;
      
      // Get AI response for translation
      const aiResponse = await getAIResponse(translationPrompt);

      if (aiResponse.needsApiKey) {
        showApiKeyDialog();
        setIsTranslating(false);
        return;
      }

      onTranslationComplete(aiResponse.text);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate message');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={handleTranslation}
      disabled={isTranslating}
    >
      {isTranslating ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Languages className="h-4 w-4" />
      )}
    </Button>
  );
}; 