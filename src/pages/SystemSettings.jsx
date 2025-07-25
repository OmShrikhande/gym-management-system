import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Palette, Bell, Mail, MessageSquare, Globe, Save, Loader2, Wifi, WifiOff, Shield } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { useTranslation } from "@/contexts/TranslationContext.jsx";
import { useI18n } from "@/components/ui/translate";
import { toast } from "sonner";
import { applySettings as applyAppSettings, forceRefreshSettings } from "@/lib/settings.jsx";
import { useRealTimeSettings } from "@/hooks/useRealTimeSettings";
import settingsCache from "@/lib/settingsCache.js";
import SettingsPerformanceMonitor from "@/components/SettingsPerformanceMonitor";
import ErrorHandlingSettings from "@/components/ErrorHandlingSettings";

const SystemSettings = () => {
  const { user, authFetch, isSuperAdmin, isGymOwner } = useAuth();
  const { t, language, changeLanguage } = useTranslation();
  const { i18n } = useI18n();
  
  // Initialize real-time settings
  const { isConnected, lastUpdate, broadcastSettingsUpdate, wsEnabled } = useRealTimeSettings();

  const [activeTab, setActiveTab] = useState("global");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    global: {
      appName: "GymFlow",
      currency: "USD",
      language: "English",
      timezone: "UTC",
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: false,
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h"
    },
    branding: {
      primaryColor: "#3B82F6",
      secondaryColor: "#8B5CF6",
      logoUrl: "",
      faviconUrl: "",
      customCss: ""
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      systemAlerts: true
    },
    messaging: {
      birthdayTemplate: "Happy Birthday [NAME]! 🎉 We hope you have a wonderful day!",
      anniversaryTemplate: "Congratulations [NAME] on your [YEARS] year anniversary with us! 🎊",
      motivationTemplate: "Keep pushing [NAME]! You're doing amazing! 💪",
      offerTemplate: "Hi [NAME]! We have a special offer just for you: [OFFER]",
      reminderTemplate: "Hi [NAME], don't forget about your workout session today at [TIME]!"
    },
    integration: {
      razorpayKey: "",
      stripeKey: "",
      twilioSid: "",
      twilioToken: "",
      emailProvider: "smtp",
      smtpHost: "",
      smtpPort: "",
      smtpUser: "",
      smtpPass: ""
    }
  });
  
  // Access control: Only super admins and gym owners can access settings
  const hasPermission = isSuperAdmin || isGymOwner;
  
  // Load settings from the server
  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !hasPermission) return;
      
      setIsLoading(true);
      try {
        // Determine the appropriate endpoint based on user role
        let endpoint;
        
        if (isSuperAdmin) {
          // Super admins can access global settings
          endpoint = '/settings';
        } else if (isGymOwner) {
          // Gym owners get their gym-specific settings
          endpoint = `/settings/gym/${user._id}`;
        } else {
          // Other users get their user-specific settings (though they shouldn't reach here due to hasPermission)
          endpoint = `/settings/user/${user._id}`;
        }
        
        console.log(`Loading settings from endpoint: ${endpoint}`);
        const response = await authFetch(endpoint);
        
        if (response.success && response.data?.settings) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...response.data.settings
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [user, authFetch, hasPermission, isGymOwner, isSuperAdmin]);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    
    // Apply language change immediately if language is changed
    if (category === 'global' && key === 'language') {
      changeLanguage(value);
    }
    
    // Save to localStorage for immediate effect
    const updatedSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    
    // Store settings in user-specific storage key
    const storageKey = `gym_settings_user_${user?._id}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedSettings));
    
    // Apply settings immediately for visual changes
    if (category === 'branding') {
      // Apply settings based on user role
      applySettings(updatedSettings);
      
      // Show toast message about settings scope
      if (!isSuperAdmin) {
        toast.info('These settings will only apply to your dashboard', { 
          duration: 3000,
          position: 'bottom-right'
        });
      }
    }
  };
  
  // State for controlling whether to apply settings to gym users
  const [applyToGymUsers, setApplyToGymUsers] = useState(true);

  // Save settings to the server
  const saveSettings = async () => {
    if (!user) {
      toast.error('You must be logged in to save settings');
      return;
    }
    
    if (!hasPermission) {
      toast.error('You do not have permission to save settings');
      return;
    }
    
    setIsSaving(true);
    
    // Apply settings optimistically (immediate UI update)
    try {
      if (isSuperAdmin) {
        applyAppSettings(settings);
        toast.info('Applying global settings...', { duration: 1000 });
      } else if (isGymOwner) {
        applyAppSettings(settings, user._id, 'gym-owner', user._id);
        toast.info('Applying settings to your dashboard...', { duration: 1000 });
      } else {
        applyAppSettings(settings, user._id, user.role, user.gymId);
        toast.info('Applying settings to your dashboard...', { duration: 1000 });
      }
    } catch (error) {
      console.error('Error applying settings optimistically:', error);
    }
    
    try {
      // Determine the appropriate endpoint based on user role
      let endpoint;
      
      if (isSuperAdmin) {
        // Super admins can save global settings
        endpoint = '/settings';
      } else if (isGymOwner) {
        // Gym owners save their gym-specific settings
        endpoint = `/settings/gym/${user._id}`;
      } else {
        // Other users save their user-specific settings (though they shouldn't reach here due to hasPermission)
        endpoint = `/settings/user/${user._id}`;
      }
      
      console.log(`Saving settings to endpoint: ${endpoint}`);
      
      // Prepare request body based on user role
      const requestBody = { settings };
      
      // For gym owners, include the applyToUsers flag
      if (isGymOwner) {
        requestBody.applyToUsers = applyToGymUsers;
      }
      
      const response = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      if (response.success) {
        toast.success(t('settingsSaved'));
        
        // Clear all caches and force refresh
        console.log('Clearing all caches and forcing refresh...');
        
        // Clear settings cache
        if (typeof settingsCache !== 'undefined') {
          settingsCache.clear();
        }
        
        // Clear localStorage caches
        const keys = Object.keys(localStorage).filter(key => key.includes('gym_settings') || key.includes('gym_branding'));
        keys.forEach(key => localStorage.removeItem(key));
        
        // Force refresh settings
        setTimeout(async () => {
          try {
            await forceRefreshSettings(user._id, user.role, user.gymId, authFetch);
            
            // Dispatch event to notify all components
            window.dispatchEvent(new CustomEvent('settingsUpdated', { 
              detail: { 
                forceRefresh: true,
                timestamp: new Date().toISOString() 
              } 
            }));
            
            toast.success('Settings applied and refreshed successfully!');
          } catch (error) {
            console.error('Error force refreshing settings:', error);
            toast.warning('Settings saved but may need a page refresh to take effect');
          }
        }, 500);
        
        // For gym owners, broadcast to users if enabled
        if (isGymOwner && applyToGymUsers) {
          try {
            // Use WebSocket to broadcast if available
            if (broadcastSettingsUpdate && wsEnabled && isConnected) {
              // Find all users in the gym and broadcast via WebSocket
              const gymUsersResponse = await authFetch(`/users?gymId=${user._id}&role=trainer,member`);
              
              if (gymUsersResponse.success && gymUsersResponse.data) {
                const userIds = gymUsersResponse.data.map(u => u._id);
                if (userIds.length > 0) {
                  broadcastSettingsUpdate(settings, userIds);
                  toast.success(`Settings applied to ${userIds.length} trainers and members in real-time`, {
                    duration: 5000
                  });
                } else {
                  toast.info('No trainers or members found to apply settings to');
                }
              }
            } else {
              // WebSocket not available, settings will be applied via server-side propagation
              toast.success('Settings saved and will be applied to all trainers and members', {
                duration: 5000,
                description: 'Users will see the updates on their next page refresh'
              });
            }
          } catch (broadcastError) {
            console.error('Error broadcasting settings:', broadcastError);
            toast.info('Settings saved but may take a moment to sync to all users');
          }
        }
        
        // Success message based on user role
        if (isSuperAdmin) {
          toast.info('Global settings applied to all users');
        } else if (isGymOwner) {
          if (applyToGymUsers) {
            toast.success('Settings will be applied to all trainers and members of your gym', {
              duration: 5000
            });
          } else {
            toast.info('Settings applied to your dashboard only');
          }
        } else {
          toast.info('Settings applied to your dashboard only');
        }
      } else {
        // Revert optimistic update on error
        toast.error(response.message || t('error'));
        // Reload to revert optimistic changes
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
      // Reload to revert optimistic changes
      setTimeout(() => window.location.reload(), 2000);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Apply settings to the application
  const applySettings = (settingsToApply) => {
    // For super admin, apply global settings
    if (isSuperAdmin) {
      // Use our utility function to apply global settings
      applyAppSettings(settingsToApply);
    } else if (isGymOwner) {
      // For gym owners, apply settings with role and ID
      applyAppSettings(
        settingsToApply, 
        user?._id, 
        'gym-owner', 
        user?._id // For gym owners, gymId is their own ID
      );
    } else {
      // For other users, apply user-specific settings with role and gymId
      applyAppSettings(
        settingsToApply, 
        user?._id, 
        user?.role, 
        user?.gymId
      );
    }
  };

  const tabs = [
    { id: "global", label: t('globalSettings'), icon: Globe },
    { id: "branding", label: t('branding'), icon: Palette },
    { id: "errorHandling", label: "Error Handling", icon: Shield },
  ];

  // Check if user has access to this page
  if (!hasPermission) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-2">{t('accessDenied')}</h2>
            <p className="text-gray-400 mb-6">
              You don't have permission to access system settings. Only Super Admins and Gym Owners can access this page.
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.history.back()}
            >
              {t('goBack')}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Performance Monitor */}
        <SettingsPerformanceMonitor />
        
        {/* Connection Status - Only show if WebSocket is connected (hide disconnected state in production) */}
        {isGymOwner && wsEnabled && isConnected && (
          <div className="flex items-center justify-between bg-gray-800/30 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-300">
                Real-time sync: Connected
              </span>
              <span className="text-xs text-gray-400">
                (Settings will update instantly for all users)
              </span>
            </div>
            {lastUpdate && (
              <span className="text-xs text-gray-400">
                Last update: {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{t('systemSettings')}</h1>
            <p className="text-gray-400">{t('configureSettings')}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Show apply to gym users toggle only for gym owners */}
            {isGymOwner && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="apply-to-users"
                  checked={applyToGymUsers}
                  onCheckedChange={setApplyToGymUsers}
                />
                <Label htmlFor="apply-to-users" className="text-sm text-gray-300">
                  Apply to all trainers and members
                </Label>
              </div>
            )}
            
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={saveSettings}
              disabled={isSaving || !hasPermission}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('saveAllChanges')}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <Card className="bg-gray-800/50 border-gray-700 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">{t('settings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
                      style={{ 
                        backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                        color: activeTab === tab.id ? 'var(--text)' : 'rgba(var(--text-rgb), 0.7)'
                      }}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {/* Global Settings */}
            {activeTab === "global" && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">{t('globalSettings')}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {t('configureSettings')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="text-gray-400">{t('loading')}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="appName" className="text-gray-300">{t('appName')}</Label>
                          <Input
                            id="appName"
                            value={settings.global.appName}
                            onChange={(e) => handleSettingChange("global", "appName", e.target.value)}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="currency" className="text-gray-300">{t('defaultCurrency')}</Label>
                          <select
                            id="currency"
                            value={settings.global.currency}
                            onChange={(e) => handleSettingChange("global", "currency", e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          >
                            <option value="USD">{t('usd')}</option>
                            <option value="EUR">{t('eur')}</option>
                            <option value="INR">{t('inr')}</option>
                            <option value="GBP">{t('gbp')}</option>
                            <option value="CAD">{t('cad')}</option>
                            <option value="AUD">{t('aud')}</option>
                            <option value="JPY">{t('jpy')}</option>
                            <option value="CNY">{t('cny')}</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="language" className="text-gray-300">{t('defaultLanguage')}</Label>
                          <select
                            id="language"
                            value={settings.global.language}
                            onChange={(e) => handleSettingChange("global", "language", e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          >
                            <option value="English">English</option>
                            <option value="Spanish">Español (Spanish)</option>
                            <option value="French">Français (French)</option>
                            <option value="Hindi">हिन्दी (Hindi)</option>
                            <option value="German">Deutsch (German)</option>
                            <option value="Chinese">中文 (Chinese)</option>
                            <option value="Japanese">日本語 (Japanese)</option>
                            <option value="Arabic">العربية (Arabic)</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="timezone" className="text-gray-300">{t('defaultTimezone')}</Label>
                          <select
                            id="timezone"
                            value={settings.global.timezone}
                            onChange={(e) => handleSettingChange("global", "timezone", e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/Denver">Mountain Time (MT)</option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="Europe/London">London (GMT)</option>
                            <option value="Europe/Paris">Central European Time (CET)</option>
                            <option value="Asia/Kolkata">India Standard Time (IST)</option>
                            <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                            <option value="Australia/Sydney">Australian Eastern Time (AET)</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="dateFormat" className="text-gray-300">{t('dateFormat')}</Label>
                          <select
                            id="dateFormat"
                            value={settings.global.dateFormat}
                            onChange={(e) => handleSettingChange("global", "dateFormat", e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                            <option value="MMM DD, YYYY">MMM DD, YYYY (Jan 01, 2023)</option>
                            <option value="DD MMM YYYY">DD MMM YYYY (01 Jan 2023)</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="timeFormat" className="text-gray-300">{t('timeFormat')}</Label>
                          <select
                            id="timeFormat"
                            value={settings.global.timeFormat}
                            onChange={(e) => handleSettingChange("global", "timeFormat", e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                          >
                            <option value="12h">12-hour (1:30 PM)</option>
                            <option value="24h">24-hour (13:30)</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}                                                                   
                </CardContent>
              </Card>
            )}

            {/* Message Templates */}
            {activeTab === "messaging" && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Message Templates</CardTitle>
                  <CardDescription className="text-gray-400">
                    Customize default message templates with dynamic variables
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-blue-400 font-medium mb-2">Available Variables</h4>
                    <p className="text-sm text-gray-300">
                      Use these placeholders in your templates: [NAME], [YEARS], [OFFER], [TIME], [DATE], [GYM_NAME]
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="birthdayTemplate" className="text-gray-300">Birthday Wishes Template</Label>
                      <Textarea
                        id="birthdayTemplate"
                        value={settings.messaging.birthdayTemplate}
                        onChange={(e) => handleSettingChange("messaging", "birthdayTemplate", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="anniversaryTemplate" className="text-gray-300">Anniversary Template</Label>
                      <Textarea
                        id="anniversaryTemplate"
                        value={settings.messaging.anniversaryTemplate}
                        onChange={(e) => handleSettingChange("messaging", "anniversaryTemplate", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="motivationTemplate" className="text-gray-300">Motivation Message Template</Label>
                      <Textarea
                        id="motivationTemplate"
                        value={settings.messaging.motivationTemplate}
                        onChange={(e) => handleSettingChange("messaging", "motivationTemplate", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="offerTemplate" className="text-gray-300">Offers Template</Label>
                      <Textarea
                        id="offerTemplate"
                        value={settings.messaging.offerTemplate}
                        onChange={(e) => handleSettingChange("messaging", "offerTemplate", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reminderTemplate" className="text-gray-300">Reminder Template</Label>
                      <Textarea
                        id="reminderTemplate"
                        value={settings.messaging.reminderTemplate}
                        onChange={(e) => handleSettingChange("messaging", "reminderTemplate", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Branding */}
            {activeTab === "branding" && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Branding & Appearance</CardTitle>
                  <CardDescription className="text-gray-400">
                    Customize the look and feel of your platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="primaryColor" className="text-gray-300">Primary Color (Buttons, Links)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settings.branding.primaryColor}
                          onChange={(e) => handleSettingChange("branding", "primaryColor", e.target.value)}
                          className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                        />
                        <Input
                          value={settings.branding.primaryColor}
                          onChange={(e) => handleSettingChange("branding", "primaryColor", e.target.value)}
                          className="flex-1 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="secondaryColor" className="text-gray-300">Secondary Color (Accents)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={settings.branding.secondaryColor}
                          onChange={(e) => handleSettingChange("branding", "secondaryColor", e.target.value)}
                          className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                        />
                        <Input
                          value={settings.branding.secondaryColor}
                          onChange={(e) => handleSettingChange("branding", "secondaryColor", e.target.value)}
                          className="flex-1 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="backgroundColor" className="text-gray-300">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={settings.branding.backgroundColor || '#111827'}
                          onChange={(e) => handleSettingChange("branding", "backgroundColor", e.target.value)}
                          className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                        />
                        <Input
                          value={settings.branding.backgroundColor || '#111827'}
                          onChange={(e) => handleSettingChange("branding", "backgroundColor", e.target.value)}
                          className="flex-1 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="cardColor" className="text-gray-300">Card Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cardColor"
                          type="color"
                          value={settings.branding.cardColor || '#1F2937'}
                          onChange={(e) => handleSettingChange("branding", "cardColor", e.target.value)}
                          className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                        />
                        <Input
                          value={settings.branding.cardColor || '#1F2937'}
                          onChange={(e) => handleSettingChange("branding", "cardColor", e.target.value)}
                          className="flex-1 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="sidebarColor" className="text-gray-300">Sidebar Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="sidebarColor"
                          type="color"
                          value={settings.branding.sidebarColor || '#1F2937'}
                          onChange={(e) => handleSettingChange("branding", "sidebarColor", e.target.value)}
                          className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                        />
                        <Input
                          value={settings.branding.sidebarColor || '#1F2937'}
                          onChange={(e) => handleSettingChange("branding", "sidebarColor", e.target.value)}
                          className="flex-1 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="textColor" className="text-gray-300">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="textColor"
                          type="color"
                          value={settings.branding.textColor || '#FFFFFF'}
                          onChange={(e) => handleSettingChange("branding", "textColor", e.target.value)}
                          className="w-16 h-10 p-1 bg-gray-700 border-gray-600"
                        />
                        <Input
                          value={settings.branding.textColor || '#FFFFFF'}
                          onChange={(e) => handleSettingChange("branding", "textColor", e.target.value)}
                          className="flex-1 bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="darkMode"
                        checked={settings.branding.darkMode !== false}
                        onCheckedChange={(checked) => handleSettingChange("branding", "darkMode", checked)}
                      />
                      <Label htmlFor="darkMode" className="text-gray-300">Dark Mode</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="logoUrl" className="text-gray-300">Logo URL</Label>
                      <Input
                        id="logoUrl"
                        value={settings.branding.logoUrl}
                        onChange={(e) => handleSettingChange("branding", "logoUrl", e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="faviconUrl" className="text-gray-300">Favicon URL</Label>
                      <Input
                        id="faviconUrl"
                        value={settings.branding.faviconUrl}
                        onChange={(e) => handleSettingChange("branding", "faviconUrl", e.target.value)}
                        placeholder="https://example.com/favicon.ico"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customCss" className="text-gray-300">Custom CSS</Label>
                      <Textarea
                        id="customCss"
                        value={settings.branding.customCss}
                        onChange={(e) => handleSettingChange("branding", "customCss", e.target.value)}
                        placeholder="/* Add your custom CSS here */"
                        className="bg-gray-700 border-gray-600 text-white font-mono"
                        rows={8}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Handling Settings */}
            {activeTab === "errorHandling" && (
              <ErrorHandlingSettings />
            )}

            {/* Add other tab contents as needed */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SystemSettings;