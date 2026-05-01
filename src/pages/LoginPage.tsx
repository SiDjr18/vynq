import { Building2, Lock, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { User } from "@/types";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true
      });
      setSession(result.token, result.user);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,_rgba(15,126,151,0.16),_transparent_32%),linear-gradient(135deg,_#f8fbfc,_#eaf5f7)] p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl border bg-card shadow-soft md:grid md:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-[#075a70] p-10 text-white md:flex md:flex-col md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md bg-white/14">
              <Building2 data-icon="inline-start" />
            </div>
            <div>
              <p className="text-lg font-semibold">VYNQ</p>
              <p className="text-sm text-white/70">Enterprise Procurement Portal</p>
            </div>
          </div>
          <div>
            <h1 className="max-w-md text-4xl font-semibold leading-tight">Procurement workflows, approvals, and vendor collaboration in one secure workspace.</h1>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {["RFQ", "QCS", "PO"].map((item) => (
                <div key={item} className="rounded-lg bg-white/12 p-4">
                  <p className="text-2xl font-semibold">{item}</p>
                  <p className="text-xs text-white/70">Ready</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Use a demo account to access role-based procurement workflows.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-2">
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <Field>
                <Label>Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" data-icon="inline-start" />
                  <Input className="pl-10" value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
              </Field>
              <Field>
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" data-icon="inline-start" />
                  <Input className="pl-10" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
              </Field>
              <Button disabled={loading}>{loading ? "Signing in..." : "Login"}</Button>
            </form>
            <div className="mt-6 rounded-lg border bg-muted/45 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Demo credentials</p>
              <p>admin@demo.com / Admin@123</p>
              <p>buyer@demo.com / Buyer@123</p>
              <p>vendor@demo.com / Vendor@123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
