import { Button } from "@/components/ui/button";
import { 
  Users, 
  Dumbbell, 
  UtensilsCrossed, 
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  Settings,
  Home,
  Building2,
  UserCheck,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * @typedef {Object} NavigationSidebarProps
 * @property {() => void} [onClose] - Optional function to close the sidebar
 */

/**
 * @param {NavigationSidebarProps} props
 */
const NavigationSidebar = ({ onClose }) => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (href) => {
    navigate(href);
    if (onClose) onClose();
  };

  const getNavigationItems = () => {
    const baseItems = [
      { label: "Dashboard", icon: Home, href: "/" }
    ];

    switch (userRole) {
      case 'super-admin':
        return [
          ...baseItems,
          { label: "Gym Management", icon: Building2, href: "/gyms" },
          { label: "User Management", icon: Users, href: "/users" },
          { label: "Billing & Plans", icon: CreditCard, href: "/billing-plans" },
          { label: "Reports", icon: BarChart3, href: "/reports" },
          { label: "System Settings", icon: Settings, href: "/settings" }
        ];
      case 'gym-owner':
        return [
          ...baseItems,
          { label: "Members", icon: Users, href: "/members" },
          { label: "Trainers", icon: UserCheck, href: "/trainers" },
          { label: "Member Plans", icon: CreditCard, href: "/gym-owner-plans" },
          { label: "Workouts", icon: Dumbbell, href: "/workouts" },
          { label: "Workout Management", icon: Dumbbell, href: "/workout-management" },
          { label: "Diet Plans", icon: UtensilsCrossed, href: "/diet-plans" },
          { label: "Messages", icon: MessageSquare, href: "/messages" },
          { label: "Reports", icon: BarChart3, href: "/reports" },
          { label: "Settings", icon: Settings, href: "/settings" }
        ];
      case 'trainer':
        return [
          ...baseItems,
          { label: "My Members", icon: Users, href: "/my-members" },
          { label: "Workouts", icon: Dumbbell, href: "/workouts" },
          { label: "Workout Management", icon: Dumbbell, href: "/workout-management" },
          { label: "Diet Plans", icon: UtensilsCrossed, href: "/diet-plans" }
        ];
      case 'member':
        return [
          ...baseItems,
          { label: "My Workouts", icon: Dumbbell, href: "/my-workouts" },
          { label: "Diet Plan", icon: UtensilsCrossed, href: "/my-diet" },
          { label: "Progress", icon: BarChart3, href: "/progress" },
          { label: "Messages", icon: MessageSquare, href: "/messages" },
          { label: "Profile", icon: Settings, href: "/profile" }
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="h-full bg-gray-800 p-4 space-y-2">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">Navigation</h2>
      </div>
      
      {navigationItems.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
          onClick={() => handleNavigation(item.href)}
        >
          <item.icon className="mr-3 h-4 w-4" />
          {item.label}
        </Button>
      ))}
    </nav>
  );
};

export default NavigationSidebar;