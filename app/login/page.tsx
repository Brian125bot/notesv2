"use client";

import { useEffect } from "react";
import { useSession, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome, Github } from "lucide-react";

export default function LoginPage() {
  const { data: session, isPending } = useSession();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      window.location.href = "/";
    }
  }, [session]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
              <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Welcome to Notes</CardTitle>
          <CardDescription>
            Sign in to access your notes from anywhere
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-12 justify-center gap-3"
            onClick={() => signIn.social({ provider: "google", callbackURL: "/" })}
          >
            <Chrome className="h-5 w-5" />
            Continue with Google
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-12 justify-center gap-3"
            onClick={() => signIn.social({ provider: "github", callbackURL: "/" })}
          >
            <Github className="h-5 w-5" />
            Continue with GitHub
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Your notes are synced across devices and work offline
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
