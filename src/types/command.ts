
export interface Command {
  id: string;
  name: string;
  description: string;
  syntax: string;
  platform: "linux" | "windows" | "both";
  examples: string[];
  created_at?: string;
  user_id?: string;
}

// This is a type used for inserting new commands
export type CommandInsert = Omit<Command, 'id' | 'created_at'>;
