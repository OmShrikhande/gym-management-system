import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import DashboardHeader from "./DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useGymCustomization } from "@/contexts/GymCustomizationContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CreditCard, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
// Import dashboard-specific styles
import "@/styles/dashboard.css";

/**
 * Dashboard Layout Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
const DashboardLayout = ({ children }) => {
  const { user, checkSubscriptionStatus, isMember, checkMembershipExpiration, updateCurrentUser } = useAuth();
  const { t } = useTranslation();
  const { customization, isLoading: customizationLoading } = useGymCustomization();
  const [subscriptionActive, setSubscriptionActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        // For members, check if their membership is active
        if (isMember) {
          // Calculate membership status directly from user data
          // This ensures we have accurate information even if API calls fail
          let hasRemainingDays = false;
          let isActive = false;
          
          // If user has membershipEndDate, calculate days remaining
          if (user.membershipEndDate) {
            const endDate = new Date(user.membershipEndDate);
            const today = new Date();
            const diffTime = endDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Update user with calculated values
            hasRemainingDays = diffDays > 0;
            isActive = diffDays > 0 || user.membershipStatus === 'Active';
            
            // Update the user object with calculated values
            if (!user.membershipDaysRemaining || user.membershipDaysRemaining !== Math.max(0, diffDays)) {
              // Only update if the value is different to avoid infinite loops
              const updatedUser = {
                ...user,
                membershipDaysRemaining: Math.max(0, diffDays),
                membershipStatus: diffDays > 0 ? 'Active' : 'Expired'
              };
              
              // Update user in context
              updateCurrentUser(updatedUser);
            }
          } else {
            // If no end date, assume active
            hasRemainingDays = true;
            isActive = true;
          }
          
          // Set subscription active if either days remaining or status is active
          setSubscriptionActive(hasRemainingDays || isActive);
          
          console.log('Member status check:', {
            membershipEndDate: user.membershipEndDate ? new Date(user.membershipEndDate).toLocaleDateString() : 'Not set',
            membershipDaysRemaining: user.membershipDaysRemaining,
            membershipStatus: user.membershipStatus,
            hasRemainingDays,
            isActive,
            subscriptionActive: hasRemainingDays || isActive
          });
        }
      }
      setIsLoading(false);
    };

    checkAccess();
  }, [user, isMember, updateCurrentUser]);

  // Show subscription expired message for members
  if (!isLoading && !subscriptionActive && isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
        <Card className="w-full max-w-md bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              {t('membershipExpired')}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {t('membershipExpiredMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-700">
              <p className="text-white mb-2">{t('member')}: {user?.name}</p>
              <p className="text-gray-400 text-sm mb-2">
                {t('membershipEndDate')} {user?.membershipEndDate ? new Date(user.membershipEndDate).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-gray-400 text-sm">
                {t('membershipStatus')}: <span className="text-yellow-500 font-medium">{user?.membershipStatus || 'Unknown'}</span>
              </p>
              {user?.membershipDaysRemaining !== undefined && (
                <p className="text-gray-400 text-sm mt-2">
                  {t('daysRemaining')}: <span className={user.membershipDaysRemaining > 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                    {user.membershipDaysRemaining}
                  </span>
                </p>
              )}
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

  // Load user-specific settings from localStorage on component mount
  useEffect(() => {
    if (!user) return;
    
    try {
      // Try to load user-specific settings first
      const userSettingsKey = `gym_settings_user_${user._id}`;
      const userSettingsStr = localStorage.getItem(userSettingsKey);
      
      if (userSettingsStr) {
        const userSettings = JSON.parse(userSettingsStr);
        console.log(`Loaded user-specific settings for user ${user._id}`);
        
        // Apply user-specific settings to the dashboard only
        if (userSettings.branding) {
          // Apply background color
          if (userSettings.branding.backgroundColor) {
            document.body.style.backgroundColor = userSettings.branding.backgroundColor;
          }
          
          // Apply text color to main content
          if (userSettings.branding.textColor) {
            const mainElement = document.querySelector('main');
            if (mainElement) {
              mainElement.style.color = userSettings.branding.textColor;
            }
          }
          
          // Apply primary color to dashboard elements
          if (userSettings.branding.primaryColor) {
            document.documentElement.style.setProperty('--dashboard-primary', userSettings.branding.primaryColor);
          }
          
          // Apply secondary color to dashboard elements
          if (userSettings.branding.secondaryColor) {
            document.documentElement.style.setProperty('--dashboard-secondary', userSettings.branding.secondaryColor);
          }
        }
      } else {
        // Fall back to global settings if no user-specific settings
        const globalSettingsStr = localStorage.getItem('gym_settings');
        if (globalSettingsStr) {
          const globalSettings = JSON.parse(globalSettingsStr);
          
          // Apply background color if available
          if (globalSettings.branding?.backgroundColor) {
            document.body.style.backgroundColor = globalSettings.branding.backgroundColor;
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, [user]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div 
        className="min-h-screen flex w-full dashboard-container" 
        style={{ 
          background: 'var(--background, linear-gradient(to bottom right, #111827, #1F2937, #111827))'
        }}
      >
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main 
            className="flex-1 p-6 dashboard-content" 
            style={{ 
              color: 'var(--text, #FFFFFF)',
              // Apply user-specific styles
              '--user-primary-color': 'var(--dashboard-primary, #3B82F6)',
              '--user-secondary-color': 'var(--dashboard-secondary, #8B5CF6)'
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
