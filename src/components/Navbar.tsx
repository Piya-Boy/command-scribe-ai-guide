import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { Terminal, LogIn, LogOut, User, Menu, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";
import ProfileDialog from "./ProfileDialog";
import SignOutDialog from "./SignOutDialog";

// menu items
const menuItems = [
  { label: "Home", href: "/" },
  { label: "Commands", href: "/commands" },
  { label: "AI Assistant", href: "/ai-assistant" },
];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = user?.user_metadata?.display_name || 
                     user?.user_metadata?.username || 
                     user?.email?.split("@")[0] || 
                     "User";
  
  const NavLinks = () => (
     <>
      {menuItems.map((item) => (
        <Link 
          key={item.href}
          to={item.href}
          className={cn(
            "text-sm font-medium hover:border-primary border-b-2 border-transparent transition-colors",
            location.pathname === item.href && "text-primary font-semibold border-primary"
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
  
  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-fluid flex h-14 sm:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <Link to="/" className="text-lg sm:text-xl font-bold">Command<span className="text-primary">Scribe</span></Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
        </nav>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarImage 
                      src={user.user_metadata.avatar_url} 
                      alt={displayName} 
                    />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{displayName}</p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    setProfileOpen(true);
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    setSignOutOpen(true);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?tab=register">Sign Up</Link>
              </Button>
            </div>
          )}
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <NavLinks />
                </div>
                {!user && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="flex flex-col gap-2 p-2">
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to="/auth">
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign In
                        </Link>
                      </Button>
                      <Button size="sm" asChild className="w-full">
                        <Link to="/auth?tab=register">Sign Up</Link>
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </header>
  );
};

export default Navbar;
