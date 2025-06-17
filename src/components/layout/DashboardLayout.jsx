import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import DashboardHeader from "./DashboardHeader";

/**
 * Dashboard Layout Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
const DashboardLayout = ({ children }) => {
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
