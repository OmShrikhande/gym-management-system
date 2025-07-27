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
  HelpCircle,
  Package,
  Palette,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; // ✅ CORRECT
import { useTranslation } from "@/contexts/TranslationContext";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (href) => {
    navigate(href);
  };

  const getNavigationItems = () => {
    const baseItems = [
      { label: t('dashboard'), icon: Home, href: "/" }
    ];

    switch (userRole) {
      case 'super-admin':
        return [
          ...baseItems,
          { label: t('gymManagement'), icon: Building2, href: "/gyms" },
          { label: t('userManagement'), icon: Users, href: "/users" },
          { label: t('billing'), icon: CreditCard, href: "/billing" },
          { label: t('reports'), icon: BarChart3, href: "/reports" },
          { label: t('systemSettings'), icon: Settings, href: "/settings" }
        ];
      case 'gym-owner':
        return [
          ...baseItems,
          { label: t('members'), icon: Users, href: "/members" },
          { label: t('trainers'), icon: UserCheck, href: "/trainers" },

          { label: t('membershipPlans'), icon: Package, href: "/membership-plans" },
          { label: t('workouts'), icon: Dumbbell, href: "/workouts" },
          { label: t('dietPlans'), icon: UtensilsCrossed, href: "/diet-plans" },
          { label: t('enquiries'), icon: HelpCircle, href: "/enquiries" },
          { label: t('messages'), icon: MessageSquare, href: "/messages" },
          { label: t('reports'), icon: BarChart3, href: "/reports" },
          { label: t('settings'), icon: Settings, href: "/settings" }
        ];
      case 'trainer':
        return [
          ...baseItems,
          { label: t('members'), icon: Users, href: "/my-members" },

          { label: t('workouts'), icon: Dumbbell, href: "/workouts" },
          { label: t('dietPlans'), icon: UtensilsCrossed, href: "/diet-plans" }
        ];
      case 'member':
        return [
          ...baseItems,

          { label: t('workouts'), icon: Dumbbell, href: "/workouts" },
          { label: t('dietPlans'), icon: UtensilsCrossed, href: "/diet-plans" }
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();
  const isActive = (href) => location.pathname === href;

  return (
    <Sidebar className="border-r border-gray-700">
      <SidebarContent style={{ backgroundColor: 'var(--sidebar, #1F2937)' }}>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 px-4 py-2">
            {t('navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full justify-start text-gray-300 hover:text-white hover:bg-opacity-70 ${
                      isActive(item.href) ? 'bg-blue-600/30 text-white' : ''
                    }`}
                    style={{ 
                      color: isActive(item.href) ? 'var(--text, #FFFFFF)' : 'rgba(var(--text-rgb, 255, 255, 255), 0.7)'
                    }}
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