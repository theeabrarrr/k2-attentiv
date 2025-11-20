import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserPlus, LogIn, Loader2, TrendingUp, Users, Clock } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created successfully! You can now log in.");
      setEmail("");
      setPassword("");
      setFullName("");
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged in successfully!");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary via-secondary/90 to-primary flex-col justify-between p-12">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center shadow-premium">
              <span className="text-2xl font-bold text-primary-foreground">K2</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">K2 Attendance</h1>
              <p className="text-white/80 text-sm">System Management</p>
            </div>
          </div>
          
          <div className="space-y-6 mt-16">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Streamline Your<br />Workforce Management
            </h2>
            <p className="text-lg text-white/90 max-w-md">
              Track attendance, manage fuel allowances, and gain insights with powerful analytics - all in one place.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-auto">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-foreground" />
              <span className="text-2xl font-bold text-white">500+</span>
            </div>
            <p className="text-sm text-white/70">Active Users</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-foreground" />
              <span className="text-2xl font-bold text-white">99.9%</span>
            </div>
            <p className="text-sm text-white/70">Uptime</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
              <span className="text-2xl font-bold text-white">24/7</span>
            </div>
            <p className="text-sm text-white/70">Support</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-border/50 shadow-elevated">
          <CardHeader className="space-y-2">
            <div className="lg:hidden flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">K2</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">K2 Attendance</h1>
                <p className="text-sm text-muted-foreground">System Management</p>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
