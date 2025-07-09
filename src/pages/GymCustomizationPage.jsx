import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GymCustomization from "@/components/gym/GymCustomization";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Palette } from "lucide-react";

const GymCustomizationPage = () => {
  const { isGymOwner, isAuthenticated } = useAuth();

  // Set page title
  useEffect(() => {
    document.title = "Gym Customization | GymFlow";
  }, []);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show access denied if not gym owner
  if (!isGymOwner) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-gray-800/50 border-gray-700 max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-white text-xl">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-400 mb-4">
                Only gym owners can access the customization settings.
              </p>
              <p className="text-sm text-gray-500">
                If you believe this is an error, please contact your gym owner or administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Gym Customization</h1>
            <p className="text-gray-400">
              Customize your gym's appearance and branding for all members and trainers
            </p>
          </div>
        </div>
        
        <GymCustomization />
      </div>
    </DashboardLayout>
  );
};

export default GymCustomizationPage;