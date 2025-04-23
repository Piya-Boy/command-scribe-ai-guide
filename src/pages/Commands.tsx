import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CommandCard from "@/components/CommandCard";
import { Button } from "@/components/ui/button";
import { Filter, BookmarkPlus, Plus, Lock, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NewCommandDialog from "@/components/NewCommandDialog";
import { Command, CommandInsert } from "@/types/command";
import { sampleCommands } from "@/data/sampleCommands";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

const Commands = () => {
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [allCommands, setAllCommands] = useState<Command[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [displayedCommands, setDisplayedCommands] = useState(4);
  const [showSavedCommands, setShowSavedCommands] = useState(false);
  const [savedCommands, setSavedCommands] = useState<Command[]>([]);
  const [commandToEdit, setCommandToEdit] = useState<Command | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { toast } = useToast();
  
  // Get commands by their platform type since we don't have a category field
  const platforms = ["linux", "windows", "both"];

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      setCurrentUserId(data.session?.user?.id || null);
    };
    
    checkAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
        setCurrentUserId(session?.user?.id || null);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch commands from Supabase
  useEffect(() => {
    const fetchCommands = async () => {
      setIsLoading(true);
      try {
        let commands: Command[] = [];

        if (isLoggedIn && currentUserId) {
          // If logged in, fetch only user's commands
          const { data, error } = await supabase
            .from('commands')
            .select('*')
            .eq('user_id', currentUserId);
          
          if (error) {
            console.error('Error fetching user commands:', error);
            throw error;
          }
          
          if (data) {
            commands = data.map(cmd => ({
              id: cmd.id,
              name: cmd.name,
              description: cmd.description,
              syntax: cmd.syntax,
              platform: cmd.platform as "linux" | "windows" | "both",
              examples: cmd.examples || [],
              user_id: cmd.user_id,
              created_at: cmd.created_at
            }));
          }
        } else {
          // If not logged in, use sample commands
          commands = sampleCommands;
        }
        
        setAllCommands(commands);
        setFilteredCommands(commands);
      } catch (error) {
        console.error("Error fetching commands:", error);
        // If error occurs while fetching user commands, fallback to sample commands
        setAllCommands(sampleCommands);
        setFilteredCommands(sampleCommands);
        toast({
          title: "Error",
          description: "Failed to load your commands. Showing sample commands instead.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommands();
  }, [toast, isLoggedIn, currentUserId]);

  // Fetch saved commands
  useEffect(() => {
    const fetchSavedCommands = async () => {
      if (!isLoggedIn || !currentUserId) return;

      try {
        // Get both bookmarks and commands in a single query
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select(`
            command_id,
            commands (
              id,
              name,
              description,
              syntax,
              platform,
              examples,
              user_id,
              created_at
            )
          `)
          .eq('user_id', currentUserId);

        if (bookmarksError) throw bookmarksError;

        if (!bookmarks || bookmarks.length === 0) {
          setSavedCommands([]);
          if (showSavedCommands) {
            setFilteredCommands([]);
          }
          return;
        }

        // Transform the data
        const transformedCommands: Command[] = bookmarks.map(b => ({
          id: b.commands.id,
          name: b.commands.name,
          description: b.commands.description,
          syntax: b.commands.syntax,
          platform: b.commands.platform as "linux" | "windows" | "both",
          examples: b.commands.examples || [],
          user_id: b.commands.user_id,
          created_at: b.commands.created_at
        }));

        setSavedCommands(transformedCommands);
        if (showSavedCommands) {
          setFilteredCommands(transformedCommands);
        }
      } catch (error) {
        console.error("Error fetching saved commands:", error);
        toast({
          title: "Error",
          description: "Failed to load saved commands",
          variant: "destructive",
        });
      }
    };

    fetchSavedCommands();

    // Set up real-time subscription for bookmark changes
    if (isLoggedIn && currentUserId) {
      const subscription = supabase
        .channel(`bookmarks-changes-${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${currentUserId}`
          },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              // Get the newly bookmarked command
              const { data: command, error } = await supabase
                .from('commands')
                .select('*')
                .eq('id', payload.new.command_id)
                .single();

              if (error) {
                console.error('Error fetching new bookmark:', error);
                return;
              }

              if (command) {
                const newCommand = {
                  id: command.id,
                  name: command.name,
                  description: command.description,
                  syntax: command.syntax,
                  platform: command.platform as "linux" | "windows" | "both",
                  examples: command.examples || [],
                  user_id: command.user_id,
                  created_at: command.created_at
                };

                setSavedCommands(prev => [...prev, newCommand]);
                if (showSavedCommands) {
                  setFilteredCommands(prev => [...prev, newCommand]);
                }
              }
            } else if (payload.eventType === 'DELETE') {
              setSavedCommands(prev => 
                prev.filter(cmd => cmd.id !== payload.old.command_id)
              );
              if (showSavedCommands) {
                setFilteredCommands(prev => 
                  prev.filter(cmd => cmd.id !== payload.old.command_id)
                );
              }
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isLoggedIn, currentUserId, toast, showSavedCommands]);

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

    if (category) {
      filtered = filtered.filter(cmd => cmd.category?.toLowerCase() === category.toLowerCase());
    }

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
      
      // Check if user is logged in
      if (!sessionData.session) {
        // Close the dialog
        setIsDialogOpen(false);
        
        // Show toast notification
        toast({
          title: "Authentication Required",
          description: "Please sign in to add commands",
          variant: "destructive",
        });
        
        // Redirect to login page
        window.location.href = "/auth";
        return;
      }
      
      // If logged in, proceed with adding the command
      const user_id = sessionData.session.user.id;
      
      // Insert the new command
      const { error } = await supabase
        .from('commands')
        .insert([{
          name: newCommand.name,
          description: newCommand.description,
          syntax: newCommand.syntax,
          platform: newCommand.platform,
          examples: newCommand.examples,
          user_id: user_id
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

  const handleDeleteCommand = async (commandId: string) => {
    try {
      const { error } = await supabase
        .from('commands')
        .delete()
        .eq('id', commandId)
        .eq('user_id', currentUserId);
      
      if (error) throw error;
      
      // Update the commands list
      const updatedCommands = allCommands.filter(cmd => cmd.id !== commandId);
      setAllCommands(updatedCommands);
      setFilteredCommands(updatedCommands);
      
      toast({
        title: "Command Deleted",
        description: "The command has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting command:", error);
      toast({
        title: "Error",
        description: "Failed to delete command",
        variant: "destructive",
      });
    }
  };

  const handleEditCommand = async (command: Command) => {
    setCommandToEdit(command);
    setIsDialogOpen(true);
  };

  const handleSubmitCommand = async (command: Command, type: string) => {
    try {
      if (type === "edit" && commandToEdit) {
        // Update existing command
        const { error } = await supabase
          .from('commands')
          .update({
            name: command.name,
            description: command.description,
            syntax: command.syntax,
            platform: command.platform,
            examples: command.examples
          })
          .eq('id', commandToEdit.id)
          .eq('user_id', currentUserId);
        
        if (error) throw error;
        
        // Update the commands list
        const updatedCommands = allCommands.map(cmd => 
          cmd.id === commandToEdit.id ? { ...command, id: commandToEdit.id, user_id: currentUserId } : cmd
        );
        setAllCommands(updatedCommands);
        setFilteredCommands(updatedCommands);
        
        toast({
          title: "Command Updated",
          description: "The command has been updated successfully",
        });
      } else {
        // Add new command
        await handleAddCommand(command);
      }
      setCommandToEdit(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating command:", error);
      toast({
        title: "Error",
        description: "Failed to update command",
        variant: "destructive",
      });
    }
  };

  const handleLoadMore = () => {
    setDisplayedCommands(prev => prev + 4);
  };

  const handleSaveCommand = async (commandId: string) => {
    if (!isLoggedIn || !currentUserId) {
      setShowAuthDialog(true);
      return;
    }

    try {
      // First check if the command is already saved
      const { data: existingBookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('command_id', commandId)
        .eq('user_id', currentUserId)
        .single();

      const isCurrentlySaved = !!existingBookmark;

      if (isCurrentlySaved) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('command_id', commandId)
          .eq('user_id', currentUserId);
        
        if (error) throw error;
        
        // Update saved commands list immediately
        setSavedCommands(prev => prev.filter(cmd => cmd.id !== commandId));
        
        // Update filtered commands if we're in saved commands view
        if (showSavedCommands) {
          setFilteredCommands(prev => prev.filter(cmd => cmd.id !== commandId));
        }
        
        toast({
          title: "Bookmark Removed",
          description: "Command removed from your bookmarks",
        });
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert([{ command_id: commandId, user_id: currentUserId }]);
        
        if (error) {
          if (error.code === '23505') { // Unique violation code
            toast({
              title: "Already Saved",
              description: "This command is already in your bookmarks",
            });
          } else {
            throw error;
          }
        } else {
          // Get the command details to add to saved commands
          const { data: commandData, error: commandError } = await supabase
            .from('commands')
            .select('*')
            .eq('id', commandId)
            .single();
          
          if (commandError) throw commandError;
          
          if (commandData) {
            const newSavedCommand = {
              id: commandData.id,
              name: commandData.name,
              description: commandData.description,
              syntax: commandData.syntax,
              platform: commandData.platform as "linux" | "windows" | "both",
              examples: commandData.examples || [],
              user_id: commandData.user_id,
              created_at: commandData.created_at
            };
            
            // Update saved commands list immediately
            setSavedCommands(prev => [...prev, newSavedCommand]);
            
            // If we're in saved commands view, update filtered commands too
            if (showSavedCommands) {
              setFilteredCommands(prev => [...prev, newSavedCommand]);
            }
            
            toast({
              title: "Command Saved",
              description: "Added to your bookmarks",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error saving command:", error);
      toast({
        title: "Error",
        description: "Failed to save command",
        variant: "destructive",
      });
    }
  };

  const handleBookmarkChange = (commandId: string, isSaved: boolean) => {
    if (isSaved) {
      // Add to saved commands
      const command = allCommands.find(cmd => cmd.id === commandId);
      if (command) {
        setSavedCommands(prev => [...prev, command]);
        if (showSavedCommands) {
          setFilteredCommands(prev => [...prev, command]);
        }
      }
    } else {
      // Remove from saved commands
      setSavedCommands(prev => prev.filter(cmd => cmd.id !== commandId));
      if (showSavedCommands) {
        setFilteredCommands(prev => prev.filter(cmd => cmd.id !== commandId));
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <motion.section 
          className="py-12 bg-gradient-to-b from-background to-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container px-4 md:px-6">
            <motion.div 
              className="flex justify-between items-center mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold">
                {showSavedCommands ? "Saved Commands" : (isLoggedIn ? "My Commands" : "Command Library")}
              </h1>
              {isLoggedIn && !showSavedCommands && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button onClick={() => {
                          setCommandToEdit(null);
                          setIsDialogOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Command
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Add a new command to the library
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </motion.div>
            
            <motion.div 
              className="mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <SearchBar onSearch={handleSearch} />
            </motion.div>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <motion.div 
                className="w-full md:w-64 bg-card rounded-lg p-4 shadow-sm"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="flex items-center mb-4">
                  <Filter className="h-5 w-5 mr-2 text-muted-foreground" />
                  <h2 className="text-lg font-medium">Filters</h2>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Platform</h3>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((platform, index) => (
                      <motion.div
                        key={platform}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Button
                          variant={activePlatform === platform ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePlatformFilter(platform)}
                          className="capitalize"
                        >
                          {platform}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="flex-1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground">
                    {showSavedCommands 
                      ? `Showing ${savedCommands.length} saved commands`
                      : isLoggedIn 
                        ? `Showing ${filteredCommands.length} of your commands`
                        : `Showing ${filteredCommands.length} commands`}
                  </p>
                  {isLoggedIn && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant={showSavedCommands ? "default" : "outline"} 
                        size="sm"
                        onClick={() => {
                          setShowSavedCommands(!showSavedCommands);
                          setDisplayedCommands(4);
                          // Immediately update filtered commands when switching views
                          if (!showSavedCommands) {
                            setFilteredCommands(savedCommands);
                          } else {
                            setFilteredCommands(allCommands);
                          }
                        }}
                      >
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        {showSavedCommands ? "Show All Commands" : "Show Saved Commands"}
                      </Button>
                    </motion.div>
                  )}
                </div>

                <div className="grid gap-6">
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {Array(4).fill(0).map((_, i) => (
                          <motion.div 
                            key={i} 
                            className="w-full border rounded-lg p-6 mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <Skeleton className="h-6 w-40 mb-2" />
                                <Skeleton className="h-4 w-60" />
                              </div>
                              <Skeleton className="h-6 w-20" />
                            </div>
                            <Skeleton className="h-16 w-full mb-4" />
                            <Skeleton className="h-12 w-full" />
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (showSavedCommands ? savedCommands : filteredCommands).length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {(showSavedCommands ? savedCommands : filteredCommands)
                          .slice(0, displayedCommands)
                          .map((command, index) => (
                          <motion.div 
                            key={command.id} 
                            className="relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <CommandCard
                              id={command.id}
                              name={command.name}
                              description={command.description}
                              syntax={command.syntax}
                              platform={command.platform}
                              examples={command.examples}
                              isSample={!command.user_id}
                              showEditDelete={isLoggedIn && command.user_id === currentUserId && !showSavedCommands}
                              onEdit={() => handleEditCommand(command)}
                              onDelete={() => handleDeleteCommand(command.id)}
                              isPublished={command.isPublished}
                              user_id={command.user_id}
                              onSave={handleBookmarkChange}
                            />
                          </motion.div>
                        ))}
                        {displayedCommands < (showSavedCommands ? savedCommands : filteredCommands).length && (
                          <motion.div 
                            className="col-span-full flex justify-center mt-6"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                variant="outline" 
                                onClick={handleLoadMore}
                                className="w-full sm:w-auto"
                              >
                                Load More Commands
                              </Button>
                            </motion.div>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="text-center py-12 text-muted-foreground col-span-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <p>
                          {showSavedCommands 
                            ? "You haven't saved any commands yet"
                            : "No commands found matching your criteria."}
                        </p>
                        {!showSavedCommands && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              variant="link" 
                              onClick={() => {
                                setActiveCategory(null);
                                setActivePlatform(null);
                                setFilteredCommands(allCommands);
                                setDisplayedCommands(4);
                              }}
                            >
                              Clear all filters
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </main>
      
      <NewCommandDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setCommandToEdit(null);
          }
        }}
        onSubmit={handleSubmitCommand}
        initialData={commandToEdit}
        type={commandToEdit ? "edit" : "add"}
      />
      
      <Footer />
    </div>
  );
};

export default Commands;