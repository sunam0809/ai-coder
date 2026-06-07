import { useAuth } from "@/components/AuthProvider";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Terminal, Code2, Cpu } from "lucide-react";
import { useEffect } from "react";

export function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      
      <header className="relative z-10 px-6 py-8 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Code2 className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold font-mono tracking-tight">AI Coder</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => setLocation("/login")}>Sign In</Button>
          <Button onClick={() => setLocation("/register")}>Get Started</Button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-500">
          The ultimate AI co-pilot <br/>for systems programming.
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
          Build EXE, DLL, SYS, and Python scripts with precision. A dark, spacious, and professional environment designed for engineers who demand power.
        </p>
        <div className="flex gap-6">
          <Button size="lg" className="h-14 px-8 text-lg font-medium" onClick={() => setLocation("/register")}>
            Start Coding
          </Button>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <Terminal className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Native Compilation</h3>
            <p className="text-muted-foreground">Generate executables and system libraries directly from your conversations.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <Code2 className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Clean Syntax</h3>
            <p className="text-muted-foreground">Flawless code generation with perfect syntax highlighting and formatting.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <Cpu className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Systems Level</h3>
            <p className="text-muted-foreground">Designed for low-level development. Ask for a Windows driver, get a Windows driver.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
