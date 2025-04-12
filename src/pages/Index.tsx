import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CommandCard from "@/components/CommandCard";
import { Button } from "@/components/ui/button";
import { Terminal, Search } from "lucide-react";
import Bookmark from "@/components/Bookmark";
import { Command } from "@/types/command";
import { sampleCommands } from "@/data/sampleCommands";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [searchResults, setSearchResults] = useState<Command[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [displayedCommands, setDisplayedCommands] = useState(4);
  const [allCommands, setAllCommands] = useState<Command[]>(sampleCommands);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch commands from Supabase
  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const { data, error } = await supabase
          .from('commands')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          const transformedCommands: Command[] = data.map(cmd => ({
            id: cmd.id,
            name: cmd.name,
            description: cmd.description,
            syntax: cmd.syntax,
            platform: cmd.platform as "linux" | "windows" | "both",
            examples: cmd.examples || [],
            user_id: cmd.user_id,
            created_at: cmd.created_at
          }));
          
          // Combine sample commands with database commands, removing duplicates
          const uniqueCommands = [...sampleCommands];
          transformedCommands.forEach(dbCmd => {
            if (!uniqueCommands.some(sampleCmd => sampleCmd.name === dbCmd.name)) {
              uniqueCommands.push(dbCmd);
            }
          });
          
          setAllCommands(uniqueCommands);
          setSearchResults(uniqueCommands);
        }
      } catch (error) {
        console.error("Error fetching commands:", error);
        toast({
          title: "Error",
          description: "Failed to load additional commands",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommands();
  }, [toast]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults(allCommands);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const filteredCommands = allCommands.filter(
      command =>
        command.name.toLowerCase().includes(query.toLowerCase()) ||
        command.description.toLowerCase().includes(query.toLowerCase()) ||
        command.examples.some(example =>
          example.toLowerCase().includes(query.toLowerCase())
        )
    );

    setSearchResults(filteredCommands);
  };

  const handleLoadMore = () => {
    setDisplayedCommands(prev => prev + 4);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-8 md:py-12 lg:py-24 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="inline-block rounded-full bg-primary/10 p-2 md:p-3">
                <Terminal className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
                Command<span className="text-primary">Scribe</span>
              </h1>
              <p className="max-w-[700px] text-muted-foreground text-sm md:text-base lg:text-xl px-4">
                Search, discover, and master command-line tools for Kali Linux and Windows CMD.
              </p>
              <div className="w-full max-w-2xl mx-auto pt-2 md:pt-4 px-4">
                <SearchBar onSearch={handleSearch} />
              </div>
              {!isSearching && !loading && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
                  {!user && (
                    <Button className="w-full sm:w-auto" onClick={() => navigate("/auth")}>Get Started</Button>
                  )}
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate("/commands")}>Browse Commands</Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Search Results */}
        {isSearching && (
          <section className="py-6 md:py-8 lg:py-12">
            <div className="container px-4 md:px-6">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">{searchResults.length > 0 ? 'Search Results' : 'No commands found'}</h2>
              <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((command) => (
                  <CommandCard
                    key={command.id}
                    id={command.id}
                    name={command.name}
                    description={command.description}
                    syntax={command.syntax}
                    platform={command.platform}
                    examples={command.examples}
                    isSample={!command.user_id}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        {!isSearching && (
          <section className="py-12 md:py-12 bg-card">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-6 md:mb-8 lg:mb-12">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter">Features</h2>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg mt-2">
                  Everything you need to master command line tools
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                <div className="flex flex-col items-center text-center p-3 sm:p-4 md:p-6 bg-background rounded-lg shadow-sm">
                  <Search className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary mb-3 md:mb-4" />
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2">Command Search</h3>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                    Quickly find the exact command you need with our powerful search functionality.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-3 sm:p-4 md:p-6 bg-background rounded-lg shadow-sm">
                  <Terminal className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary mb-3 md:mb-4" />
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2">Command Examples</h3>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                    Learn through practical examples with detailed explanations for each command.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-3 sm:p-4 md:p-6 bg-background rounded-lg shadow-sm">
                  <Bookmark className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary mb-3 md:mb-4" />
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2">Save Favorites</h3>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                    Bookmark your most-used commands for quick access anytime.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Popular Commands */}
        {!isSearching && (
          <section className="py-8 md:py-12 lg:py-24">
            <div className="container px-4 md:px-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter mb-6 md:mb-8 lg:mb-12 text-center">
                Popular Commands
              </h2>
              <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="w-full border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Skeleton className="h-6 w-40 mb-2" />
                          <Skeleton className="h-4 w-60" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <Skeleton className="h-16 w-full mb-4" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))
                ) : (
                  allCommands.slice(0, displayedCommands).map((command) => (
                    <CommandCard
                      key={command.id}
                      id={command.id}
                      name={command.name}
                      description={command.description}
                      syntax={command.syntax}
                      platform={command.platform}
                      examples={command.examples}
                      isSample={!command.user_id}
                    />
                  ))
                )}
              </div>
              <div className="mt-6 md:mt-8 lg:mt-12 text-center">
                {!isLoading && displayedCommands < allCommands.length && (
                  <Button className="w-full sm:w-auto" onClick={handleLoadMore}>
                    Load More Commands
                  </Button>
                )}
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
