import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dumbbell, Settings, User, LogOut, CreditCard, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useGymCustomization } from "@/hooks/useGymCustomization";
import { Link } from "react-router-dom";
import NotificationCenter from "./NotificationCenter";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { toast } from "sonner";

const DashboardHeader = () => {
  const { 
    user, 
    userRole, 
    logout, 
    isGymOwner, 
    hasActiveSubscription, 
    subscriptionDaysRemaining,
    checkSubscriptionStatus
  } = useAuth();
  const { t } = useTranslation();
  const { customization } = useGymCustomization();
  
  // Function to refresh the page
  const handleRefresh = () => {
    toast.info(t('loading'));
    window.location.reload();
  };
  
  // Check subscription status only once when component mounts
  // This prevents repeated API calls on every render
  useEffect(() => {
    if (isGymOwner && user?._id) {
      // Only check if we don't have subscription data or it's been more than 30 minutes
      const lastCheckTime = window.lastSubscriptionCheckTime || 0;
      const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
      
      if (Date.now() - lastCheckTime > CACHE_DURATION) {
        checkSubscriptionStatus(user._id, null, false);
      }
    }
  }, [isGymOwner, user, checkSubscriptionStatus]);

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Sidebar Toggle */}
          <div className="flex items-center space-x-4">
            <SidebarTrigger className="text-white hover:bg-gray-700" />
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {customization?.branding?.systemName || 'GymFlow'}
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {customization?.branding?.systemSubtitle || 'Gym Management Platform'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Refresh Button, Subscription Status, Notifications and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher className="text-gray-300 hover:text-white" />
            
            {/* Refresh Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              className="text-gray-300 hover:text-white hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{t('refresh')}</span>
            </Button>
            
            {/* Subscription Status for Gym Owners */}
            {isGymOwner && (
              <>
                {hasActiveSubscription ? (
                  <Badge 
                    variant={subscriptionDaysRemaining <= 2 ? "destructive" : "default"}
                    className="hidden sm:flex items-center gap-1"
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    {subscriptionDaysRemaining <= 2 
                      ? `Expires in ${subscriptionDaysRemaining} day${subscriptionDaysRemaining === 1 ? '' : 's'}`
                      : t('subscriptionActive')
                    }
                  </Badge>
                ) : (
                  <Link to="/billing-plans">
                    <Badge 
                      variant="destructive"
                      className="hidden sm:flex items-center gap-1 cursor-pointer"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      {t('membershipExpired')}
                    </Badge>
                  </Link>
                )}
              </>
            )}
            
            {/* Notifications */}
            <NotificationCenter />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt="User avatar" />
                    <AvatarFallback className="bg-gray-600 text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-white">{user?.name}</p>
                    <p className="text-xs leading-none text-gray-400">{user?.email}</p>
                    <Badge variant="secondary" className="w-fit mt-1">
                      {userRole.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 hover:text-white" asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 hover:text-white" asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('settings')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem 
                  className="text-red-400 hover:bg-red-900 hover:text-red-300"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;