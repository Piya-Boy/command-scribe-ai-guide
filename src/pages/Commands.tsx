
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import CommandCard from "@/components/CommandCard";
import { Button } from "@/components/ui/button";
import { Filter, BookmarkPlus } from "lucide-react";
import { sampleCommands, Command } from "@/data/sampleCommands";

const Commands = () => {
  const [filteredCommands, setFilteredCommands] = useState<Command[]>(sampleCommands);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  // Get unique categories and platforms for filters
  const categories = Array.from(new Set(sampleCommands.map(cmd => cmd.category)));
  const platforms = ["linux", "windows", "both"];

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      applyFilters(activeCategory, activePlatform);
      return;
    }

    const results = sampleCommands.filter(
      command =>
        command.name.toLowerCase().includes(query.toLowerCase()) ||
        command.description.toLowerCase().includes(query.toLowerCase()) ||
        command.examples.some(example =>
          example.toLowerCase().includes(query.toLowerCase())
        )
    );

    // Apply any active filters to the search results
    let filtered = results;
    if (activeCategory) {
      filtered = filtered.filter(cmd => cmd.category === activeCategory);
    }
    if (activePlatform) {
      filtered = filtered.filter(cmd => cmd.platform === activePlatform);
    }

    setFilteredCommands(filtered);
  };

  const applyFilters = (category: string | null, platform: string | null) => {
    let filtered = sampleCommands;

    if (category) {
      filtered = filtered.filter(cmd => cmd.category === category);
    }

    if (platform) {
      filtered = filtered.filter(cmd => cmd.platform === platform);
    }

    setFilteredCommands(filtered);
    setActiveCategory(category);
    setActivePlatform(platform);
  };

  const handleCategoryFilter = (category: string) => {
    const newCategory = activeCategory === category ? null : category;
    applyFilters(newCategory, activePlatform);
  };

  const handlePlatformFilter = (platform: string) => {
    const newPlatform = activePlatform === platform ? null : platform;
    applyFilters(activeCategory, newPlatform);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <h1 className="text-3xl font-bold mb-6">Command Library</h1>
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
                  <h3 className="text-sm font-medium mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={activeCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCategoryFilter(category)}
                        className="capitalize"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
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
                  {filteredCommands.length > 0 ? (
                    filteredCommands.map((command) => (
                      <CommandCard
                        key={command.id}
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
                          setFilteredCommands(sampleCommands);
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
      <Footer />
    </div>
  );
};

export default Commands;
