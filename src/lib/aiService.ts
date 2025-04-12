import { Command } from "@/data/sampleCommands";
import { getApiKey } from "./apiKeyManager";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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
    const apiKey = getApiKey();
    
    if (!apiKey) {
      return {
        text: "Please set an API key to use the AI Assistant",
        needsApiKey: true
      };
    }

    // Initialize Gemini client with the API key
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
          parts: [{ text: `You are a helpful AI assistant specializing in command line operations. Follow these guidelines strictly:

1. When suggesting commands, ALWAYS format them with each field on a new line like this:


name:
command-name


description:
clear description of what the command does


Syntax:
<code>basic command syntax with placeholders</code>


platform:
linux, windows, or both


Examples:
<code>example1</code>
<code>example2</code>
<code>example3</code>


category:
network, file, system, etc.


Example of correct format:


name:
nmap


description:
Network exploration tool and security scanner


Syntax:
<code>nmap [options] [target]</code>


platform:
linux, windows, or both


Examples:
<code>nmap -sV 192.168.1.1</code>
<code>nmap -p 1-100 192.168.1.1-254</code>
<code>nmap -A scanme.nmap.org</code>


category:
network, file, system


2. For each command, provide:
   - A clear explanation of what the command does
   - The basic syntax with placeholders for parameters
   - 2-3 practical examples showing different use cases
   - The platform(s) it works on
   - Any important warnings or safety considerations

3. Format examples in code blocks using triple backticks with 'bash' or 'cmd' as the language identifier

4. If a command might be dangerous, include appropriate warnings

5. For non-command questions, provide helpful and concise answers

6. ALWAYS ensure the format matches the exact structure shown above`
  }],
        },
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const responseText = response.text() || "Sorry, I couldn't generate a response.";
    
    // Check if the response contains a suggested command in JSON format
    let suggestedCommand: Partial<Command> | undefined;
    
    try {
      // Try to parse the response as JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const commandData = JSON.parse(jsonMatch[0]);
        suggestedCommand = {
          name: commandData.name || "",
          description: commandData.description || "",
          syntax: commandData.syntax || "",
          platform: commandData.platform || "both",
          examples: Array.isArray(commandData.examples) ? commandData.examples : [commandData.examples || ""],
          category: commandData.category || "command"
        };
      }
    } catch (error) {
      console.error("Error parsing command JSON:", error);
    }

    return {
      text: responseText,
      suggestedCommand
    };
  } catch (error) {
    console.error('Error getting AI response:', error);
    
    // Handle specific Gemini errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return {
          text: "API Key ของคุณไม่ถูกต้องหรือหมดอายุ กรุณาตั้งค่าใหม่",
          needsApiKey: true
        };
      } else if (error.message.includes('rate limit')) {
        return {
          text: "คุณได้ใช้โควต้าการเรียก API หมดแล้ว กรุณาลองใหม่ในภายหลัง",
          rateLimitExceeded: true
        };
      } else if (error.message.includes('network')) {
        return {
          text: "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
          networkError: true
        };
      }
    }
    
    return {
      text: "ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 