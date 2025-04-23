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
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
});

const registerSchema = loginSchema.extend({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters",
  }),
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters",
  }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters",
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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute left-4 top-4"
      >
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="flex items-center"
        >
          <FaArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </motion.div>

      <motion.div 
        className="mx-auto flex w-full flex-col items-center space-y-6 max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="flex flex-col items-center space-y-2 text-center"
          variants={itemVariants}
        >
          <h1 className="text-3xl font-bold">Command<span className="text-primary">Scribe</span></h1>
          <p className="text-muted-foreground">
            Sign in to save and manage your commands
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="w-full">
            <CardHeader>
              <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mx-auto">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Sign Up</TabsTrigger>
                </TabsList>
              
                <CardContent>
                  <AnimatePresence mode="wait">
                    <TabsContent value="login" className="mt-3">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col space-y-4"
                      >
                        <motion.div 
                          className="grid grid-cols-1 gap-4"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <motion.div variants={itemVariants}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button 
                                variant="outline" 
                                type="button"
                                className="w-full"
                                onClick={() => signInWithProvider("github")}
                              >
                                <FaGithub className="mr-2 h-4 w-4" />
                                Continue with GitHub
                              </Button>
                            </motion.div>
                          </motion.div>

                          <motion.div variants={itemVariants}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button 
                                variant="outline" 
                                type="button"
                                className="w-full"
                                onClick={() => signInWithProvider("google")}
                              >
                                <FaGoogle className="mr-2 h-4 w-4" />
                                Continue with Google
                              </Button>
                            </motion.div>
                          </motion.div>
                        </motion.div>

                        <motion.div 
                          className="relative"
                          variants={itemVariants}
                        >
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                              Or continue with
                            </span>
                          </div>
                        </motion.div>

                        <Form {...loginForm}>
                          <motion.form 
                            onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                            className="space-y-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            <motion.div variants={itemVariants}>
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
                            </motion.div>
                            <motion.div variants={itemVariants}>
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
                            </motion.div>
                            <motion.div variants={itemVariants}>
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Button 
                                  disabled={loading} 
                                  className="w-full" 
                                  type="submit"
                                >
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
                              </motion.div>
                            </motion.div>
                          </motion.form>
                        </Form>
                      </motion.div>
                    </TabsContent>
                    <TabsContent value="register" className="mt-3">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col space-y-4"
                      >
                        <motion.div 
                          className="grid grid-cols-1 gap-4"
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <motion.div variants={itemVariants}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button 
                                variant="outline" 
                                type="button"
                                className="w-full"
                                onClick={() => signInWithProvider("github")}
                              >
                                <FaGithub className="mr-2 h-4 w-4" />
                                Continue with GitHub
                              </Button>
                            </motion.div>
                          </motion.div>

                          <motion.div variants={itemVariants}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button 
                                variant="outline" 
                                type="button"
                                className="w-full"
                                onClick={() => signInWithProvider("google")}
                              >
                                <FaGoogle className="mr-2 h-4 w-4" />
                                Continue with Google
                              </Button>
                            </motion.div>
                          </motion.div>
                        </motion.div>

                        <motion.div 
                          className="relative"
                          variants={itemVariants}
                        >
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                              Or continue with
                            </span>
                          </div>
                        </motion.div>

                        <Form {...registerForm}>
                          <motion.form 
                            onSubmit={registerForm.handleSubmit(onRegisterSubmit)} 
                            className="space-y-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            <motion.div variants={itemVariants}>
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
                            </motion.div>
                            <motion.div variants={itemVariants}>
                              <FormField
                                control={registerForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="johndoe" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                            <motion.div variants={itemVariants}>
                              <FormField
                                control={registerForm.control}
                                name="displayName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="John Doe" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                            <motion.div variants={itemVariants}>
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
                            </motion.div>
                            <motion.div variants={itemVariants}>
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
                            </motion.div>
                            <motion.div variants={itemVariants}>
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Button 
                                  disabled={loading} 
                                  className="w-full" 
                                  type="submit"
                                >
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
                              </motion.div>
                            </motion.div>
                          </motion.form>
                        </Form>
                      </motion.div>
                    </TabsContent>
                  </AnimatePresence>
                </CardContent>
              </Tabs>
            </CardHeader>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
