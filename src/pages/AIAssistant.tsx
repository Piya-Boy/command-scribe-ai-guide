import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, SaveIcon, Copy, RefreshCw, Edit, Check, X } from "lucide-react";
import { Command } from "@/data/sampleCommands";
import { getAIResponse } from "@/lib/aiService";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { hasApiKey, setApiKey } from "@/lib/apiKeyManager";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import NewCommandDialog from "@/components/NewCommandDialog";
import { supabase } from "@/integrations/supabase/client";
import AuthRequiredDialog from "@/components/AuthRequiredDialog";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  suggestedCommand?: Partial<Command>;
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
  const [showNewCommandDialog, setShowNewCommandDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [commandToSave, setCommandToSave] = useState<Partial<Command> | null>(
    null
  );
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [editedText, setEditedText] = useState<Record<string, string>>({});

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
        suggestedCommand: aiResponse.suggestedCommand,
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

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleSaveMessage = (message: Message) => {
    // Extract command information from the message
    // This is a simple implementation - you might want to enhance this
    // to better extract command details from the message text
    const commandName = message.text.match(/`([^`]+)`/)?.[1] || "";
    const commandDescription = message.text
      .split("\n")[0]
      .replace(/`[^`]+`/, "")
      .trim();
    const commandSyntax =
      message.text.match(/```(?:bash|shell)?\n([^`]+)```/)?.[1] || "";

    // Extract multiple examples from code blocks
    const codeBlockRegex = /```(?:bash|shell)?\n([^`]+)```/g;
    const codeBlocks = [...message.text.matchAll(codeBlockRegex)];
    const commandExamples = codeBlocks
      .map((block) => block[1].trim())
      .filter(Boolean);

    // If no code blocks found, try to find examples in the text
    let additionalExamples: string[] = [];
    if (commandExamples.length === 0) {
      // Look for lines that might be examples (lines with command name)
      const lines = message.text.split("\n");
      additionalExamples = lines
        .filter((line) => line.includes(commandName) && !line.includes("```"))
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && line !== commandSyntax);
    }

    // Combine all examples
    const allExamples = [...commandExamples, ...additionalExamples];

    // Clean up examples by removing '#' '*' and any leading/trailing whitespace
    const cleanedExamples = allExamples
      .map((example) => example.replace(/[#*]/g, "").trim())
      .filter((example) => example.length > 0);

    // Determine platform based on message content
    let platform: "linux" | "windows" | "both" = "both";

    const hasLinux = message.text.toLowerCase().includes("linux");
    const hasWindows = message.text.toLowerCase().includes("windows");

    if (hasLinux && hasWindows) {
      platform = "both";
    } else if (hasLinux) {
      platform = "linux";
    } else if (hasWindows) {
      platform = "windows";
    }

    // Create a partial command object
    const command: Partial<Command> = {
      name: commandName || "",
      description: commandDescription || "",
      syntax: commandSyntax || "",
      platform: platform,
      examples: cleanedExamples.length > 0 ? cleanedExamples : [""],
    };

    // Set the command to save and open the dialog
    setCommandToSave(command);
    setShowNewCommandDialog(true);
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
        suggestedCommand: aiResponse.suggestedCommand,
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

  const handleAddCommand = async (newCommand: Command, type: string) => {
    try {
      // Get the session to check if user is logged in
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      // Check if user is logged in
      if (!sessionData.session) {
        // Close the new command dialog
        setShowNewCommandDialog(false);
        // Show auth required dialog
        setShowAuthDialog(true);
        return;
      }

      // If logged in, proceed with adding the command
      const user_id = sessionData.session.user.id;

      // Insert the new command
      const { error } = await supabase.from("commands").insert([
        {
          name: newCommand.name,
          description: newCommand.description,
          syntax: newCommand.syntax,
          platform: newCommand.platform,
          examples: newCommand.examples,
          user_id: user_id,
        },
      ]);

      if (error) throw error;

      toast.success("Command Added", {
        description: `${newCommand.name} has been added successfully`,
      });
    } catch (error) {
      console.error("Error adding command:", error);
      toast.error("Error", {
        description: "Failed to add command",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="py-6 md:py-12">
          <div className="container px-4 md:px-6">
            <h1 className="text-3xl font-bold mb-6">AI Command Assistant</h1>
            <div className="flex flex-col bg-card rounded-lg shadow-sm overflow-hidden">
              <div className="flex-1 overflow-y-auto  p-4 space-y-4 min-h-[500px] max-h-[500px]">
                {messages.map((message) => (
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
                            code: ({ node, className, children, ...props }) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const isBlock = match !== null;
                              return isBlock ? (
                                <pre className="bg-gray-400 dark:text-gray-800 p-2 rounded font-mono text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap break-words mb-4">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              ) : (
                                <code className="bg-gray-400 dark:text-gray-800 px-2 py-1 rounded font-mono text-xs sm:text-sm" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {message.text}
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
                              {/* if edit prompt then generate new answer */}
                              <div className="flex justify-end space-x-2 mt-2">
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setMessages(prev => prev.map(m =>
                                      m.id === message.id ? {...m, text: editedText[message.id]} : m
                                    ));
                                    setIsEditing(prev => ({...prev, [message.id]: false}));
                                    // Regenerate answer with the edited prompt
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
                      {message.sender === "assistant" && !isLoading && (
                        <div className="flex space-x-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleCopyMessage(message.text)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleSaveMessage(message)}
                          >
                            <SaveIcon className="h-4 w-4" />
                          </Button>
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
              {/* Input Area */}
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
      <NewCommandDialog
        open={showNewCommandDialog}
        onOpenChange={setShowNewCommandDialog}
        onSubmit={handleAddCommand}
        initialData={commandToSave}
        type="add"
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
