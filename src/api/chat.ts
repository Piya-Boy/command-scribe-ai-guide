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
          parts: [{ text: "You are a helpful command line assistant. When users ask about commands, provide the command details in a structured format. For other queries, be helpful and concise." }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const aiResponse = response.text() || "ไม่สามารถสร้างคำตอบได้";

    // Check if the response contains a command suggestion
    let suggestedCommand = undefined;
    if (aiResponse?.toLowerCase().includes('command:')) {
      // Extract command details from the response
      const commandMatch = aiResponse.match(/command:\s*(\w+)\s*description:\s*([^.]+)/i);
      if (commandMatch) {
        suggestedCommand = {
          name: commandMatch[1],
          description: commandMatch[2].trim(),
          syntax: commandMatch[0].split('\n')[0].replace('command:', '').trim(),
          platform: 'linux', // Default to linux, can be enhanced based on context
          examples: [commandMatch[0].split('\n')[1]?.replace('example:', '').trim()].filter(Boolean),
        };
      }
    }

    return {
      text: aiResponse,
      suggestedCommand,
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