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

const MAX_RETRIES = 3;
const TIMEOUT = 10000; // 10 seconds

export async function getAIResponseWithRetry(userMessage: string): Promise<GPTResponse> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      const response = await getAIResponse(userMessage, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      if (i === MAX_RETRIES - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}

export async function getAIResponse(userMessage: string, options?: { signal?: AbortSignal }): Promise<GPTResponse> {
  try {
    // Get and validate the decrypted API key
    const apiKey = await getApiKey();
    
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
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
      },
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

    const result = await model.generateContent(userMessage, { signal: options?.signal });
    const response = await result.response;
    const text = response.text();

    return {
      text,
    };
  } catch (error) {
    console.error('Error getting AI response:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        removeApiKey();
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
  try {
    const lines = response.split('\n');
    let currentCommand: Partial<Command> = {
      name: '',
      description: '',
      syntax: '',
      platform: 'both',
      examples: []
    };

    let isInExamples = false;
    let examples: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('- **Name:**')) {
        currentCommand.name = trimmedLine.replace('- **Name:**', '').trim();
      } else if (trimmedLine.startsWith('- **Description:**')) {
        currentCommand.description = trimmedLine.replace('- **Description:**', '').trim();
      } else if (trimmedLine.startsWith('- **Syntax:**')) {
        currentCommand.syntax = trimmedLine.replace('- **Syntax:**', '').trim();
      } else if (trimmedLine.startsWith('- **Platform:**')) {
        const platform = trimmedLine.replace('- **Platform:**', '').trim().toLowerCase();
        if (platform.includes('linux')) {
          currentCommand.platform = 'linux';
        } else if (platform.includes('windows')) {
          currentCommand.platform = 'windows';
        } else {
          currentCommand.platform = 'both';
        }
      } else if (trimmedLine.startsWith('- **Examples:**')) {
        isInExamples = true;
      } else if (isInExamples && trimmedLine && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*')) {
        examples.push(trimmedLine.trim());
      }
    }

    currentCommand.examples = examples.filter(e => e.trim());
    
    // Only return if we have at least the essential fields
    if (currentCommand.name && currentCommand.description && currentCommand.syntax) {
      return currentCommand;
    }
    
    return undefined;
  } catch (error) {
    console.error('Error parsing command response:', error);
    return undefined;
  }
} 