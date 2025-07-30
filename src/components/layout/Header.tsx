// src/components/layout/Header.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed out successfully." });
      navigate("/signin"); // Redirect to sign-in page
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", variant: "destructive" });
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b bg-card text-card-foreground">
      <div>{/* Maybe Page Title or Breadcrumbs */}</div>
      <div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};

export default Header;
