
export interface Command {
  id: string;
  name: string;
  description: string;
  syntax: string;
  platform: "linux" | "windows" | "both";
  examples: string[];
  category?: string;
}
