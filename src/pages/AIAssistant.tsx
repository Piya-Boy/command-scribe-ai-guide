import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Copy, RefreshCw, Edit, Check, X, Languages } from "lucide-react";
import { getAIResponse } from "@/lib/aiService";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { hasApiKey, setApiKey } from "@/lib/apiKeyManager";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import AuthRequiredDialog from "@/components/AuthRequiredDialog";
import { Components } from "react-markdown";
import { TranslationButton } from "@/components/TranslationButton";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  translatedText?: string;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I'm your command line assistant. Ask me about Linux or Windows commands, and I'll help you find what you need.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [editedText, setEditedText] = useState<Record<string, string>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check if API key exists on component mount
    if (!hasApiKey()) {
      setShowApiKeyDialog(true);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      sender: "user",
      text: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get AI response
      const aiResponse = await getAIResponse(input);

      // Check if API key is needed
      if (aiResponse.needsApiKey) {
        setShowApiKeyDialog(true);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "assistant",
            text: aiResponse.text,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: aiResponse.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "I'm sorry, I encountered an error. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveApiKey = (apiKey: string) => {
    setApiKey(apiKey);
    setShowApiKeyDialog(false);
  };

  const handleCopyCode = (codeText: string, id: string) => {
    // Step 1: Copy the text to clipboard
    navigator.clipboard.writeText(codeText);
    
    // Step 2: Show success feedback
    setCopiedCodeId(id);
    toast.success("Command copied to clipboard");
    
    // Step 3: Reset the feedback after 2 seconds
    setTimeout(() => {
      if (copiedCodeId === id) {
        setCopiedCodeId(null);
      }
    }, 2000);
  };

  const handleRegenerateAnswer = async (userMessage: string) => {
    setIsLoading(true);
    try {
      const aiResponse = await getAIResponse(userMessage);

      if (aiResponse.needsApiKey) {
        setShowApiKeyDialog(true);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "assistant",
            text: aiResponse.text,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: aiResponse.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error regenerating AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "I'm sorry, I encountered an error. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslationComplete = (messageId: string, translatedText: string | undefined) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? {...m, translatedText}
        : m
    ));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="py-6 md:py-12">
          <div className="container px-4 md:px-6">
            <h1 className="text-3xl font-bold mb-6">AI Command Assistant</h1>
            <div className="flex flex-col bg-card rounded-lg shadow-sm overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[500px] max-h-[500px]">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[100%] rounded-lg p-4 ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            pre: ({ children }) => (
                              <pre className="bg-gray-500 dark:bg-gray-300 text-gray-900 rounded-md p-2 overflow-x-auto my-2">
                                {children}
                              </pre>
                            ),
                            code: ({ children, className }) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !match;
                              
                              if (isInline) {
                                return (
                                  <code className="bg-gray-500 dark:bg-gray-300 text-gray-900 px-1 py-0.5 rounded text-sm font-mono">
                                    {children}
                                  </code>
                                );
                              }
                              
                              return (
                                <div className="relative flex justify-between items-center">
                                  <code className="bg-gray-500 dark:bg-gray-300 text-gray-900 block p-2 rounded-md text-sm font-mono whitespace-pre-wrap break-words">
                                    {children}
                                  </code>
                                  {(() => {
                                    const uniqueId = `code-${message.id}-${Date.now()}`;
                                    return (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute text-gray-900 dark:text-muted-foreground top-1 right-1 w-6 h-6 px-2 text-xs"
                                        onClick={() => {
                                          const codeText = children?.toString() || '';
                                          handleCopyCode(codeText, uniqueId);
                                        }}
                                      >
                                        {copiedCodeId === uniqueId ? (
                                          <Check className="h-3 w-3" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    );
                                  })()}
                                </div>
                              );
                            }
                          }}
                        >
                          {message.translatedText || message.text}
                        </ReactMarkdown>
                      </div>
                      {message.sender === "user" && (
                        <div className="relative">
                          {!isEditing[message.id] && (
                            <button
                              className="absolute top-0 right-0 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                              onClick={() => {
                                setIsEditing(prev => ({...prev, [message.id]: true}));
                                setEditedText(prev => ({...prev, [message.id]: message.text}));  
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {isEditing[message.id] && (
                            <>
                              <Textarea
                                value={editedText[message.id]}
                                onChange={e => setEditedText(prev => ({...prev, [message.id]: e.target.value}))}
                                className="mt-2 text-white"
                              />
                              <div className="flex justify-end space-x-2 mt-2">
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setMessages(prev => prev.map(m =>
                                      m.id === message.id ? {...m, text: editedText[message.id]} : m
                                    ));
                                    setIsEditing(prev => ({...prev, [message.id]: false}));
                                    handleRegenerateAnswer(editedText[message.id]);
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setIsEditing(prev => ({...prev, [message.id]: false}))}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {message.sender === "assistant" && !isLoading && message.id !== "welcome" && (
                        <div className="flex space-x-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              // Find the previous user message
                              const messageIndex = messages.findIndex(
                                (m) => m.id === message.id
                              );
                              if (messageIndex > 0) {
                                const userMessage = messages[messageIndex - 1];
                                if (userMessage.sender === "user") {
                                  handleRegenerateAnswer(userMessage.text);
                                }
                              }
                            }}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <TranslationButton
                            text={message.text}
                            messageId={message.id}
                            onTranslationComplete={(translatedText) => handleTranslationComplete(message.id, translatedText)}
                            showApiKeyDialog={() => setShowApiKeyDialog(true)}
                            isTranslated={!!message.translatedText}
                          />
                        </div>
                      )}
                      <span className="block mt-1 text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 rounded-full bg-current animate-bounce"></div>
                        <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]"></div>
                        <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="">
                <div className="max-w-3xl mx-auto px-4 py-4">
                  <div className="relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask anything"
                      className="rounded-full placeholder-gray-400 focus:ring-0 focus:border-0"
                      maxLength={200}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                      <Button
                        onClick={handleSendMessage}
                        size="icon"
                        variant="ghost"
                        className="text-gray-400 hover:text-white"
                        disabled={isLoading || !input.trim()}
                      >
                        <Send className={`${handleKeyPress ? "text-gray-500" : "text-gray-800"}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ApiKeyDialog
        open={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        onSave={handleSaveApiKey}
      />
      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        message="Please sign in to save this command to your collection. This will allow you to access and manage your saved commands later."
        title="Sign In to Save Command"
      />
    </div>
  );
};

export default AIAssistant;
