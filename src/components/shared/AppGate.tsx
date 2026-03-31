import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import blueokraLogo from "@/assets/blueokra-logo.svg";

const SESSION_KEY = "bo_app_gate";

export const AppGate = ({ children }: { children: React.ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gateUser = import.meta.env.VITE_APP_GATE_USER || "admin";
    const gatePass = import.meta.env.VITE_APP_GATE_PASS || "blue@123";
    if (username === gateUser && password === gatePass) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthenticated(true);
    } else {
      setError("Invalid credentials");
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <img src={blueokraLogo} alt="BlueOkra" className="w-8 h-8" />
            <h1 className="font-display text-2xl font-bold text-foreground">BlueOkra</h1>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
            <Lock className="w-4 h-4" />
            <p className="text-sm">This app is password-protected</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gate-user">Username</Label>
            <Input id="gate-user" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gate-pass">Password</Label>
            <Input id="gate-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Sign In</Button>
        </div>
      </form>
    </div>
  );
};
