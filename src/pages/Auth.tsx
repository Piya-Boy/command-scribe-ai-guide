import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FaGithub, FaGoogle, FaEye, FaEyeSlash, FaSpinner, FaArrowLeft, FaSignInAlt, FaUserPlus } from "react-icons/fa";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

const registerSchema = loginSchema.extend({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters",
  }),
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters",
  }),
  confirmPassword: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    searchParams.get("tab") === "register" ? "register" : "login"
  );
  const { user, loading, signIn, signUp, signInWithProvider } = useAuth();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register" || tab === "login") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      await signUp(data.email, data.password, data.username, data.displayName);
      setActiveTab("login");
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <Button
        variant="ghost"
        className="absolute left-4 top-4"
        onClick={() => navigate("/")}
      >
        <FaArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <div className="mx-auto flex w-full flex-col items-center space-y-6 max-w-md">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-3xl font-bold">Command<span className="text-primary">Scribe</span></h1>
          <p className="text-muted-foreground">
            Sign in to save and manage your commands
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mx-auto">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>
            
              <CardContent>
                <TabsContent value="login" className="mt-3">
                  <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <Button 
                        variant="outline" 
                        type="button"
                        className="w-full"
                        onClick={() => signInWithProvider("github")}
                      >
                        <FaGithub className="mr-2 h-4 w-4" />
                        Continue with GitHub
                      </Button>

                      <Button 
                        variant="outline" 
                        type="button"
                        className="w-full"
                        onClick={() => signInWithProvider("google")}
                      >
                        <FaGoogle className="mr-2 h-4 w-4" />
                        Continue with Google
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="name@example.com" 
                                  type="email"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="••••••••" 
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    {...field} 
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <FaEyeSlash className="h-4 w-4" />
                                    ) : (
                                      <FaEye className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">
                                      {showPassword ? "Hide password" : "Show password"}
                                    </span>
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button disabled={loading} className="w-full" type="submit">
                          {loading ? (
                            <>
                              <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                              Signing In...
                            </>
                          ) : (
                            <>
                              <FaSignInAlt className="mr-2 h-4 w-4" />
                              Sign In
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </TabsContent>
                <TabsContent value="register" className="mt-3">
                  <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <Button 
                        variant="outline" 
                        type="button"
                        className="w-full"
                        onClick={() => signInWithProvider("github")}
                      >
                        <FaGithub className="mr-2 h-4 w-4" />
                        Sign Up with GitHub
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        type="button"
                        className="w-full"
                        onClick={() => signInWithProvider("google")}
                      >
                        <FaGoogle className="mr-2 h-4 w-4" />
                        Sign Up with Google
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="name@example.com" 
                                  type="email"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="username" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="displayName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Your Name" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="••••••••" 
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    {...field} 
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <FaEyeSlash className="h-4 w-4" />
                                    ) : (
                                      <FaEye className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">
                                      {showPassword ? "Hide password" : "Show password"}
                                    </span>
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="••••••••" 
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    {...field} 
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
                                      <FaEyeSlash className="h-4 w-4" />
                                    ) : (
                                      <FaEye className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">
                                      {showConfirmPassword ? "Hide password" : "Show password"}
                                    </span>
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button disabled={loading} className="w-full" type="submit">
                          {loading ? (
                            <>
                              <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            <>
                              <FaUserPlus className="mr-2 h-4 w-4" />
                              Create Account
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
