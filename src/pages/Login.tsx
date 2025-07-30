
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-bella to-bella-light p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full bg-bella hover:bg-bella-dark text-white"
            onClick={handleLogin}
          >
            Enter Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
