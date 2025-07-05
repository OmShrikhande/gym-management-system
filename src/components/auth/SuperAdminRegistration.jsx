import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, Mail, Lock, User, Key, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// API URL - Use environment variable or fallback to production
const API_URL = import.meta.env.VITE_API_URL || 'https://gym-management-system-ckb0.onrender.com/api';

const SuperAdminRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    secretKey: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminCount, setAdminCount] = useState({
    count: 0,
    maxCount: 5,
    available: 5
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Function to fetch super admin count
  const fetchSuperAdminCount = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/auth/super-admin-count`);
      if (response.ok) {
        const data = await response.json();
        setAdminCount(data.data);
      }
    } catch (error) {
      console.error("Error fetching super admin count:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch super admin count on component mount
  useEffect(() => {
    fetchSuperAdminCount();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.name || !formData.email || !formData.password || !formData.secretKey) {
        toast.error("All fields are required");
        setIsSubmitting(false);
        return;
      }

      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        setIsSubmitting(false);
        return;
      }

      // Call the backend API to register super admin
      const response = await fetch(`${API_URL}/auth/register-super-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          secretKey: formData.secretKey
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Registration failed");
        // Refresh super admin count in case the error is due to reaching the limit
        await fetchSuperAdminCount();
        setIsSubmitting(false);
        return;
      }

      // Registration successful
      toast.success("Super admin registered successfully");
      
      // Store token and user data in local storage
      localStorage.setItem('gymflow_token', data.token);
      localStorage.setItem('gymflow_user', JSON.stringify(data.data.user));
      
      // Redirect to dashboard
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Dumbbell className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">GymFlow</h1>
          <p className="text-gray-400">Super Admin Registration</p>
        </div>

        {/* Registration Form */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Create Super Admin</CardTitle>
            <CardDescription className="text-gray-400">
              Register as the system super administrator
            </CardDescription>
            {!isLoading && (
              <div className="mt-4 flex items-center justify-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-blue-400">
                  {adminCount.available} of {adminCount.maxCount} super admin slots available
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password (min 8 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-gray-300">Secret Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="Enter the super admin secret key"
                    value={formData.secretKey}
                    onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>
              
              {adminCount.available <= 0 && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-center">
                  <p className="text-red-300 text-sm">
                    All super admin slots are currently filled. No more super admins can be registered.
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                disabled={isSubmitting || adminCount.available <= 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Super Admin"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">
                  Already have an account? <a href="/login" className="text-blue-400 hover:underline">Sign In</a>
                </p>
                <p className="text-gray-400 text-sm">
                  Note: {adminCount.count} of {adminCount.maxCount} super admin accounts are currently in use
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminRegistration;