import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CommandCard from "@/components/CommandCard";
import { Button } from "@/components/ui/button";
import { Filter, BookmarkPlus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NewCommandDialog from "@/components/NewCommandDialog";
import { Command, CommandInsert } from "@/types/command";
import { Skeleton } from "@/components/ui/skeleton";

const Commands = () => {
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [allCommands, setAllCommands] = useState<Command[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Get commands by their platform type since we don't have a category field
  const platforms = ["linux", "windows", "both"];

  // Fetch commands from Supabase
  useEffect(() => {
    const fetchCommands = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('commands')
          .select('*');
        
        if (error) throw error;
        
        if (!data) {
          setAllCommands([]);
          setFilteredCommands([]);
          return;
        }
        
        // Transform the commands to match our Command type
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
        
        setAllCommands(transformedCommands);
        setFilteredCommands(transformedCommands);
      } catch (error) {
        console.error("Error fetching commands:", error);
        toast({
          title: "Error",
          description: "Failed to load commands",
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
      applyFilters(activeCategory, activePlatform);
      return;
    }

    const results = allCommands.filter(
      command =>
        command.name.toLowerCase().includes(query.toLowerCase()) ||
        command.description.toLowerCase().includes(query.toLowerCase()) ||
        command.examples.some(example =>
          example.toLowerCase().includes(query.toLowerCase())
        )
    );

    // Apply any active filters to the search results
    let filtered = results;
    if (activePlatform) {
      filtered = filtered.filter(cmd => cmd.platform === activePlatform);
    }

    setFilteredCommands(filtered);
  };

  const applyFilters = (category: string | null, platform: string | null) => {
    let filtered = allCommands;

    // We're not using category filtering since there's no category field
    // but keeping the parameter for future expansion

    if (platform) {
      filtered = filtered.filter(cmd => cmd.platform === platform);
    }

    setFilteredCommands(filtered);
    setActiveCategory(category);
    setActivePlatform(platform);
  };

  const handlePlatformFilter = (platform: string) => {
    const newPlatform = activePlatform === platform ? null : platform;
    applyFilters(activeCategory, newPlatform);
  };

  const handleAddCommand = async (newCommand: CommandInsert) => {
    try {
      // Get the session to check if user is logged in
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      // If no session, set user_id to null so it becomes a public command
      const user_id = sessionData.session?.user.id;
      
      // Insert the new command
      const { error } = await supabase
        .from('commands')
        .insert([{
          name: newCommand.name,
          description: newCommand.description,
          syntax: newCommand.syntax,
          platform: newCommand.platform,
          examples: newCommand.examples
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Command Added",
        description: `${newCommand.name} has been added successfully`,
      });
      
      // Refresh commands
      const { data, error: fetchError } = await supabase
        .from('commands')
        .select('*');
      
      if (fetchError) throw fetchError;
      
      if (!data) {
        return;
      }
      
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
      
      setAllCommands(transformedCommands);
      setFilteredCommands(transformedCommands);
      
    } catch (error) {
      console.error("Error adding command:", error);
      toast({
        title: "Error",
        description: "Failed to add command",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Command Library</h1>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Command
              </Button>
            </div>
            
            <div className="mb-8">
              <SearchBar onSearch={handleSearch} />
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="w-full md:w-64 bg-card rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-4">
                  <Filter className="h-5 w-5 mr-2 text-muted-foreground" />
                  <h2 className="text-lg font-medium">Filters</h2>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Platform</h3>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map(platform => (
                      <Button
                        key={platform}
                        variant={activePlatform === platform ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePlatformFilter(platform)}
                        className="capitalize"
                      >
                        {platform}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground">
                    Showing {filteredCommands.length} commands
                  </p>
                  <Button variant="outline" size="sm">
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Saved Commands
                  </Button>
                </div>

                <div className="grid gap-6">
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
                  ) : filteredCommands.length > 0 ? (
                    filteredCommands.map((command) => (
                      <CommandCard
                        key={command.id}
                        id={command.id}
                        name={command.name}
                        description={command.description}
                        syntax={command.syntax}
                        platform={command.platform}
                        examples={command.examples}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No commands found matching your criteria.</p>
                      <Button 
                        variant="link" 
                        onClick={() => {
                          setActiveCategory(null);
                          setActivePlatform(null);
                          setFilteredCommands(allCommands);
                        }}
                      >
                        Clear all filters
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <NewCommandDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAddCommand}
      />
      
      <Footer />
    </div>
  );
};

export default Commands;
