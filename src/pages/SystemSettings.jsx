import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Palette, Bell, Mail, MessageSquare, Globe, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState("global");
  const [settings, setSettings] = useState({
    global: {
      appName: "GymFlow",
      currency: "USD",
      language: "English",
      timezone: "UTC",
      emailEnabled: true,
      smsEnabled: true,
      whatsappEnabled: false
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

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: "global", label: "Global Settings", icon: Globe },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "messaging", label: "Message Templates", icon: MessageSquare },
    { id: "integration", label: "Integrations", icon: Settings }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">System Settings</h1>
            <p className="text-gray-400">Configure global and gym-specific settings</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <Card className="bg-gray-800/50 border-gray-700 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Settings Categories</CardTitle>
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
                  <CardTitle className="text-white">Global Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure system-wide settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="appName" className="text-gray-300">Application Name</Label>
                      <Input
                        id="appName"
                        value={settings.global.appName}
                        onChange={(e) => handleSettingChange("global", "appName", e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency" className="text-gray-300">Default Currency</Label>
                      <select
                        id="currency"
                        value={settings.global.currency}
                        onChange={(e) => handleSettingChange("global", "currency", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="INR">INR - Indian Rupee</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="language" className="text-gray-300">Default Language</Label>
                      <select
                        id="language"
                        value={settings.global.language}
                        onChange={(e) => handleSettingChange("global", "language", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="timezone" className="text-gray-300">Default Timezone</Label>
                      <select
                        id="timezone"
                        value={settings.global.timezone}
                        onChange={(e) => handleSettingChange("global", "timezone", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Asia/Kolkata">India Standard Time</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Communication Services</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">Email Service</Label>
                          <p className="text-sm text-gray-400">Enable email notifications and communication</p>
                        </div>
                        <Switch
                          checked={settings.global.emailEnabled}
                          onCheckedChange={(checked) => handleSettingChange("global", "emailEnabled", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">SMS Service</Label>
                          <p className="text-sm text-gray-400">Enable SMS notifications and communication</p>
                        </div>
                        <Switch
                          checked={settings.global.smsEnabled}
                          onCheckedChange={(checked) => handleSettingChange("global", "smsEnabled", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-gray-300">WhatsApp Service</Label>
                          <p className="text-sm text-gray-400">Enable WhatsApp notifications and communication</p>
                        </div>
                        <Switch
                          checked={settings.global.whatsappEnabled}
                          onCheckedChange={(checked) => handleSettingChange("global", "whatsappEnabled", checked)}
                        />
                      </div>
                    </div>
                  </div>
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
                      <Label htmlFor="primaryColor" className="text-gray-300">Primary Color</Label>
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
                      <Label htmlFor="secondaryColor" className="text-gray-300">Secondary Color</Label>
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

            {/* Add other tab contents as needed */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SystemSettings;