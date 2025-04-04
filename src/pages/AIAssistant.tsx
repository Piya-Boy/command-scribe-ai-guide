
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Terminal, MessageSquare, SaveIcon } from "lucide-react";
import { Command } from "@/data/sampleCommands";

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

  const handleSendMessage = () => {
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

    // Simulate AI response (in a real app, this would be an API call)
    setTimeout(() => {
      // Example response with a suggested command
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "Based on your request, here's a command that might help:",
        timestamp: new Date(),
        suggestedCommand: {
          name: "grep",
          description: "Search for patterns in files",
          syntax: "grep [options] pattern [file...]",
          platform: "linux",
          examples: ["grep -r 'search term' /path/to/directory"],
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="py-6 md:py-12">
          <div className="container px-4 md:px-6">
            <h1 className="text-3xl font-bold mb-6">AI Command Assistant</h1>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-3/4 flex flex-col bg-card rounded-lg shadow-sm overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: "500px", maxHeight: "500px" }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>

                        {message.suggestedCommand && (
                          <div className="mt-3 p-3 border bg-card rounded-md">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold">
                                {message.suggestedCommand.name}
                              </h4>
                              <Button variant="ghost" size="sm">
                                <SaveIcon className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {message.suggestedCommand.description}
                            </p>
                            <div className="mt-2 p-2 bg-muted rounded text-sm font-mono">
                              {message.suggestedCommand.syntax}
                            </div>
                            {message.suggestedCommand.examples && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">Example:</p>
                                <div className="p-2 bg-muted rounded text-sm font-mono">
                                  {message.suggestedCommand.examples[0]}
                                </div>
                              </div>
                            )}
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

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask about a command or task..."
                      className="min-h-[60px]"
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="icon"
                      disabled={isLoading || !input.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/4">
                <div className="bg-card rounded-lg shadow-sm p-4">
                  <h3 className="font-medium flex items-center mb-4">
                    <Terminal className="h-4 w-4 mr-2" />
                    Popular Queries
                  </h3>
                  <div className="space-y-2">
                    {[
                      "How to find files in Linux?",
                      "Command to list network connections",
                      "How to check disk space?",
                      "Process management commands",
                      "How to create a new directory?"
                    ].map((query, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="w-full justify-start text-sm h-auto py-2 px-3"
                        onClick={() => setInput(query)}
                      >
                        <MessageSquare className="h-3 w-3 mr-2 text-muted-foreground" />
                        {query}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AIAssistant;
