
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

interface CommandProps {
  name: string;
  description: string;
  syntax: string;
  platform: "linux" | "windows" | "both";
  examples?: string[];
}

const CommandCard = ({ name, description, syntax, platform, examples = [] }: CommandProps) => {
  const platformColor = {
    linux: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    windows: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    both: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-mono">{name}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge className={`${platformColor[platform]}`}>
            {platform === "both" ? "Linux & Windows" : platform === "linux" ? "Linux" : "Windows"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Syntax:</p>
          <pre className="bg-muted p-2 rounded font-mono text-sm overflow-x-auto">
            <code>{syntax}</code>
          </pre>
        </div>

        {examples.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Examples:</p>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <pre key={index} className="bg-muted p-2 rounded font-mono text-sm overflow-x-auto">
                  <code>{example}</code>
                </pre>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" className="ml-auto" size="sm">
          <Bookmark className="h-4 w-4 mr-1" />
          Save
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CommandCard;
