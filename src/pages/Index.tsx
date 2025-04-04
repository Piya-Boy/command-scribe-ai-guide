
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CommandCard from "@/components/CommandCard";
import { Button } from "@/components/ui/button";
import { Terminal, Search } from "lucide-react";
import Bookmark from "@/components/Bookmark";
import { sampleCommands, Command } from "@/data/sampleCommands";

const Index = () => {
  const [searchResults, setSearchResults] = useState<Command[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const filteredCommands = sampleCommands.filter(
      command =>
        command.name.toLowerCase().includes(query.toLowerCase()) ||
        command.description.toLowerCase().includes(query.toLowerCase()) ||
        command.examples.some(example =>
          example.toLowerCase().includes(query.toLowerCase())
        )
    );

    setSearchResults(filteredCommands);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="inline-block rounded-full bg-primary/10 p-3">
                <Terminal className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tighter">
                Command<span className="text-primary">Scribe</span>
              </h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Search, discover, and master command-line tools for Kali Linux and Windows CMD.
              </p>
              <div className="w-full max-w-2xl mx-auto pt-4">
                <SearchBar onSearch={handleSearch} />
              </div>
              {!isSearching && (
                <div className="flex gap-4 mt-4">
                  <Button>Get Started</Button>
                  <Button variant="outline">Browse Commands</Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Search Results */}
        {isSearching && (
          <section className="py-8 md:py-12">
            <div className="container px-4 md:px-6">
              <h2 className="text-2xl font-bold mb-6">{searchResults.length > 0 ? 'Search Results' : 'No commands found'}</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {searchResults.map((command) => (
                  <CommandCard
                    key={command.id}
                    name={command.name}
                    description={command.description}
                    syntax={command.syntax}
                    platform={command.platform}
                    examples={command.examples}
                  />
                ))}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-8 text-center">
                  <Button variant="outline">View All Commands</Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Features Section */}
        {!isSearching && (
          <section className="py-12 md:py-24 bg-card">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tighter">Features</h2>
                <p className="text-muted-foreground md:text-lg mt-2">
                  Everything you need to master command line tools
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
                  <Search className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Command Search</h3>
                  <p className="text-muted-foreground">
                    Quickly find the exact command you need with our powerful search functionality.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
                  <Terminal className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Command Examples</h3>
                  <p className="text-muted-foreground">
                    Learn through practical examples with detailed explanations for each command.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
                  <Bookmark className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Save Favorites</h3>
                  <p className="text-muted-foreground">
                    Bookmark your most-used commands for quick access anytime.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Popular Commands */}
        {!isSearching && (
          <section className="py-12 md:py-24">
            <div className="container px-4 md:px-6">
              <h2 className="text-3xl font-bold tracking-tighter mb-12 text-center">
                Popular Commands
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {sampleCommands.slice(0, 4).map((command) => (
                  <CommandCard
                    key={command.id}
                    name={command.name}
                    description={command.description}
                    syntax={command.syntax}
                    platform={command.platform}
                    examples={command.examples.slice(0, 1)}
                  />
                ))}
              </div>
              <div className="mt-12 text-center">
                <Button>Browse All Commands</Button>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
