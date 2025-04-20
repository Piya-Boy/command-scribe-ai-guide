import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Shield, Key, Eye, EyeOff, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiKey, removeApiKey } from "@/lib/apiKeyManager";

interface ApiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export function ApiKeyDialog({ open, onClose, onSave }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const key = getApiKey();
      setCurrentKey(key);
    }
  }, [open]);

  const validateApiKey = (key: string) => {
    // Basic validation for Google AI API key format
    const isValidFormat = /^AIza[A-Za-z0-9_-]{35}$/.test(key);
    return isValidFormat;
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError("Please enter a Google AI API Key");
      return;
    }

    if (!validateApiKey(apiKey)) {
      setError("Invalid API key format. It must start with 'AIza' followed by 35 characters");
      return;
    }

    onSave(apiKey);
    setApiKey("");
    setError("");
    setCurrentKey(apiKey);
  };

  const handleClear = () => {
    removeApiKey();
    setCurrentKey(null);
    setApiKey("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Google AI API Key Settings
          </DialogTitle>
          <DialogDescription>
            You need to provide a Google AI API Key to use the AI Assistant. Your API Key will be encrypted and stored locally on your device only.
          </DialogDescription>
          {/* ไปเอา API Key ได้จากลิงค์นี้ */}
          <DialogDescription>
            <a href="https://console.cloud.google.com/welcome" target="_blank" rel="noopener noreferrer">
              Go to Google Cloud Console to create an API Key
            </a>
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your API Key will be encrypted and stored securely on your device, and will only be used in this browser.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 py-4">
          {currentKey && (
            <div className="grid gap-2">
              <Label>Current API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showKey ? "text" : "password"}
                  value={currentKey}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleClear}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="apiKey">New Google AI API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError("");
              }}
              className="font-mono"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 