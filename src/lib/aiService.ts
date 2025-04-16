import { Command } from "@/data/sampleCommands";
import { getApiKey, removeApiKey } from "./apiKeyManager";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { toast } from "sonner";

interface GPTResponse {
  text: string;
  suggestedCommand?: Partial<Command>;
  needsApiKey?: boolean;
  rateLimitExceeded?: boolean;
  networkError?: boolean;
  error?: string;
}

export async function getAIResponse(userMessage: string): Promise<GPTResponse> {
  try {
    // Get and validate the decrypted API key
    const apiKey = getApiKey();
    
    if (!apiKey) {
      toast.error("Invalid API Key", {
        description: "Please set up a new API Key",
      });
      return {
        text: "Please enter your Google AI API Key to use the AI Assistant",
        needsApiKey: true
      };
    }

    // Initialize Gemini client with the decrypted API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Call Gemini API with the correct format
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are a helpful command line assistant. When users ask about commands, provide the command details in a structured format. For other queries, be helpful and concise." }],
        },
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const responseText = response.text() || "Sorry, unable to generate a response";

    // Parse the response to extract command information if present
    const suggestedCommand = parseCommandFromResponse(responseText);

    return {
      text: responseText,
      suggestedCommand,
    };
  } catch (error) {
    console.error('Error getting AI response:', error);
    
    // Handle general errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        removeApiKey(); // Remove the invalid key
        toast.error("Invalid API Key", {
          description: "Please set up a new API Key",
        });
        return {
          text: "Your API Key is invalid or expired. Please set up a new one.",
          needsApiKey: true
        };
      } else if (error.message.includes('rate limit')) {
        toast.error("Rate Limit Exceeded", {
          description: "You have reached your API quota limit. Please try again later.",
        });
        return {
          text: "You have reached your API quota limit. Please try again later.",
          rateLimitExceeded: true
        };
      } else if (error.message.includes('network')) {
        toast.error("Connection Failed", {
          description: "Please check your internet connection",
        });
        return {
          text: "Network connection error. Please check your internet connection",
          networkError: true
        };
      }
    }
    
    toast.error("Error", {
      description: "An unexpected error occurred. Please try again.",
    });
    return {
      text: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Helper function to parse command information from AI response
function parseCommandFromResponse(response: string): Partial<Command> | undefined {
  // Implement command parsing logic here
  // This is a placeholder - you'll need to implement the actual parsing logic
  return undefined;
} 