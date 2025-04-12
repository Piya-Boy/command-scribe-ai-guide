import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <form className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search for commands (e.g., 'nmap', 'dir', 'ifconfig')..."
          className="pl-10 w-full rounded-full"
          value={query}
          onChange={handleChange}
        />
        {/* cancel button */}
        {query && (
          <Button  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-muted-foreground rounded-full w-8 h-8 " onClick={() => setQuery("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;