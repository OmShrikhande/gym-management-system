import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import DashboardHeader from "./DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CreditCard, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Dashboard Layout Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
const DashboardLayout = ({ children }) => {
  const { user, checkSubscriptionStatus, isMember } = useAuth();
  const [subscriptionActive, setSubscriptionActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        // For members, check if their membership is active
        if (isMember) {
          const membershipActive = await checkSubscriptionStatus(user._id, null, true);
          setSubscriptionActive(membershipActive);
        }
      }
      setIsLoading(false);
    };

    checkAccess();
  }, [user, checkSubscriptionStatus, isMember]);

  // Show subscription expired message for members
  if (!isLoading && !subscriptionActive && isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
        <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              Membership Expired
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your membership has expired. Please renew to continue accessing the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-700">
              <p className="text-white mb-2">Member: {user?.name}</p>
              <p className="text-gray-400 text-sm">
                Your membership expired on {user?.membershipEndDate ? new Date(user.membershipEndDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/billing-plans')}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Renew Membership
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
