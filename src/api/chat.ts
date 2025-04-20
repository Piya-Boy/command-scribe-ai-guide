import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Command } from "@/data/sampleCommands";

// This is a mock API endpoint for development
// In a real application, you would use a proper backend server
export async function handleChatRequest(message: string, apiKey: string) {
  try {
    if (!message) {
      return { error: 'Message is required' };
    }

    if (!apiKey) {
      return { error: 'Google AI API key is required' };
    }

    // Validate API key format
    if (!apiKey.match(/^AIza[A-Za-z0-9_-]{35}$/)) {
      return { error: 'Invalid API key format' };
    }

    // Initialize Gemini client with the key from the request
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
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
          parts: [{ text: `You are an expert command line assistant specializing in both Linux and Windows commands. 
Your responses should always follow this structured format when explaining commands:

- **Name:** [command name]
- **Description:** [clear, concise description of what the command does]
- **Syntax:** [basic command syntax with common options]
- **Platform:** [Linux/Windows/Both]
- **Examples:**
  [practical example with explanation]
  [another example with different options]
  [complex example for advanced usage]

Guidelines for your responses:
1. Be precise and accurate with command syntax
2. Provide real-world, practical examples
3. Include common use cases and best practices
4. Mention any important warnings or considerations
5. For complex commands, break down the examples
6. Always verify platform compatibility

For non-command queries, provide clear, concise, and accurate information focused on practical solutions.` }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const aiResponse = response.text() || "ไม่สามารถสร้างคำตอบได้";

    // Parse the response to extract command information
    const commandInfo = parseCommandResponse(aiResponse);

    return {
      text: aiResponse,
      suggestedCommand: commandInfo,
    };
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return { error: 'Invalid or expired API key' };
      } else if (error.message.includes('rate limit')) {
        return { error: 'Rate limit exceeded. Please try again later.' };
      } else if (error.message.includes('network')) {
        return { error: 'Network error. Please check your internet connection.' };
      }
    }
    
    return { error: 'Internal server error' };
  }
}

// Helper function to parse command information
function parseCommandResponse(response: string): Partial<Command> | undefined {
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