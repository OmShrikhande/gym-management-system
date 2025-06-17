import { useNavigate, useLocation } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext"; // ✅ CORRECT
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (href) => {
    navigate(href);
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
          { label: "Billing & Plans", icon: CreditCard, href: "/billing" },
          { label: "Reports", icon: BarChart3, href: "/reports" },
          { label: "System Settings", icon: Settings, href: "/settings" }
        ];
      case 'gym-owner':
        return [
          ...baseItems,
          { label: "Members", icon: Users, href: "/members" },
          { label: "Trainers", icon: UserCheck, href: "/trainers" },
          { label: "Workouts", icon: Dumbbell, href: "/workouts" },
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
          { label: "Diet Plans", icon: UtensilsCrossed, href: "/diet-plans" },
          { label: "Messages", icon: MessageSquare, href: "/messages" },
          { label: "Schedule", icon: Calendar, href: "/schedule" }
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
  const isActive = (href) => location.pathname === href;

  return (
    <Sidebar className="border-r border-gray-700">
      <SidebarContent className="bg-gray-800">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 px-4 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700 ${
                      isActive(item.href) ? 'bg-gray-700 text-white' : ''
                    }`}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}