import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AuthProvider } from "@/contexts/AuthContext.jsx";
import { TranslationProvider } from "@/contexts/TranslationContext.jsx";
import ProtectedRoute from "@/components/auth/ProtectedRoute.jsx";
import SettingsInitializer from "@/components/SettingsInitializer.jsx";
import Index from "./pages/Index.jsx";
import NotFound from "./pages/NotFound.jsx";
import GymManagement from "./pages/GymManagement.jsx";
import GymOwnerDetails from "./pages/GymOwnerDetails.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import BillingPlans from "./pages/BillingPlans.jsx";
import GymOwnerPlans from "./pages/GymOwnerPlans.jsx";
import Reports from "./pages/Reports.jsx";
import SystemSettings from "./pages/SystemSettings.jsx";
import Members from "./pages/Members.jsx";
import Trainers from "./pages/Trainers.jsx";
import Workouts from "./pages/Workouts.jsx";
import WorkoutPage from "./pages/WorkoutPage.jsx";
import DietPlans from "./pages/DietPlans.jsx";
import Messages from "./pages/Messages.jsx";
import MyMembers from "./pages/MyMembers.jsx";
import Schedule from "./pages/Schedule.jsx";
import Profile from "./pages/Profile.jsx";
import SuperAdminRegistration from "./components/auth/SuperAdminRegistration.jsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <TranslationProvider>
          <Toaster position="top-center" richColors />
          <SettingsInitializer />
          <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register-super-admin" element={<SuperAdminRegistration />} />
          
          {/* Super Admin & Gym Owner Routes */}
          <Route path="/gyms" element={
            <ProtectedRoute allowedRoles={['super-admin', 'gym-owner']}>
              <GymManagement />
            </ProtectedRoute>
          } />
          <Route path="/gym-management" element={
            <ProtectedRoute allowedRoles={['super-admin', 'gym-owner']}>
              <GymManagement />
            </ProtectedRoute>
          } />
          <Route path="/gym-owner/:id" element={
            <ProtectedRoute allowedRoles={['super-admin']}>
              <GymOwnerDetails />
            </ProtectedRoute>
          } />
          
          {/* Super Admin Routes */}
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['super-admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/billing" element={
            <ProtectedRoute allowedRoles={['super-admin']}>
              <BillingPlans />
            </ProtectedRoute>
          } />
          <Route path="/billing-plans" element={
            <ProtectedRoute allowedRoles={['super-admin']}>
              <BillingPlans />
            </ProtectedRoute>
          }
          />
          <Route path="/gym-owner-plans" element={
            <ProtectedRoute allowedRoles={['gym-owner', 'super-admin']}>
              <GymOwnerPlans />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['super-admin', 'gym-owner']}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SystemSettings />
            </ProtectedRoute>
          } />
          
          {/* Gym Owner & Trainer Routes */}
          <Route path="/members" element={
            <ProtectedRoute allowedRoles={['super-admin', 'gym-owner', 'trainer']}>
              <Members />
            </ProtectedRoute>
          } />
          <Route path="/trainers" element={
            <ProtectedRoute allowedRoles={['super-admin', 'gym-owner']}>
              <Trainers />
            </ProtectedRoute>
          } />
          
          {/* All Authenticated Users Routes */}
          <Route path="/workouts" element={
            <ProtectedRoute>
              <Workouts />
            </ProtectedRoute>
          } />
          <Route path="/workout-management" element={
            <ProtectedRoute>
              <WorkoutPage />
            </ProtectedRoute>
          } />
          <Route path="/diet-plans" element={
            <ProtectedRoute>
              <DietPlans />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute allowedRoles={['super-admin', 'gym-owner', 'trainer']}>
              <Messages />
            </ProtectedRoute>
          } />
          
          {/* Trainer Routes */}
          <Route path="/my-members" element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <MyMembers />
            </ProtectedRoute>
          } />
          <Route path="/schedule" element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          } />
          
          {/* User Profile - Available to all authenticated users */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
        </TranslationProvider>
      </AuthProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;
