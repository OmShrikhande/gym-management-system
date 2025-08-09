import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Monitor, 
  Sparkles, 
  Settings, 
  Save, 
  RotateCcw,
  Eye,
  Network,
  Activity
} from "lucide-react";

import FuturisticBackground, { availableThemes, getThemesByCategory } from "@/components/FuturisticBackground";

/**
 * System Settings Page - Background Management
 * Allows gym owners to customize their background effects
 */
const SystemSettings = () => {
  const { user, userRole, authFetch, isGymOwner } = useAuth();
  const { t } = useTranslation();
  
  // Background settings state
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [intensity, setIntensity] = useState("medium");
  const [backgroundEnabled, setBackgroundEnabled] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Load current settings
  useEffect(() => {
    loadCurrentSettings();
  }, [user]);

  const loadCurrentSettings = async () => {
    if (!user || !authFetch) return;
    
    setLoading(true);
    try {
      // Try to load from localStorage first
      const storageKey = isGymOwner ? `gym_background_${user._id}` : `gym_background_${user.gymId || user.createdBy}`;
      const savedSettings = localStorage.getItem(storageKey);
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setSelectedTheme(settings.theme || "classic");
        setIntensity(settings.intensity || "medium");
        setBackgroundEnabled(settings.enabled !== false);
      }
      
      // Also try to fetch from server
      const endpoint = isGymOwner ? `/settings/gym/${user._id}` : `/settings/user/${user._id}`;
      const response = await authFetch(endpoint);
      
      if (response.success && response.data?.settings?.background) {
        const backgroundSettings = response.data.settings.background;
        setSelectedTheme(backgroundSettings.theme || "classic");
        setIntensity(backgroundSettings.intensity || "medium");
        setBackgroundEnabled(backgroundSettings.enabled !== false);
      }
    } catch (error) {
      console.error("Error loading background settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIntensityChange = (value) => {
    setIntensity(getIntensityLabel(value[0]));
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
    
    if (!previewMode) {
      toast.success("Preview mode enabled");
    } else {
      toast.info("Preview mode disabled");
    }
  };

  const saveSettings = async () => {
    if (!user || !authFetch) return;
    
    setSaving(true);
    try {
      const backgroundSettings = {
        theme: selectedTheme,
        intensity: intensity,
        enabled: backgroundEnabled,
        appliedAt: new Date().toISOString(),
      };

      // Save to localStorage
      const storageKey = isGymOwner ? `gym_background_${user._id}` : `gym_background_${user.gymId || user.createdBy}`;
      localStorage.setItem(storageKey, JSON.stringify(backgroundSettings));

      // Save to server
      const endpoint = isGymOwner ? `/settings/gym/${user._id}` : `/settings/user/${user._id}`;
      const response = await authFetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          background: backgroundSettings,
        }),
      });

      if (response.success) {
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('backgroundChanged', {
          detail: {
            theme: selectedTheme,
            intensity: intensity,
            enabled: backgroundEnabled,
            userId: user._id,
            userRole: userRole,
          }
        }));
        
        toast.success("Background settings saved successfully!");
        setPreviewMode(false);
      } else {
        throw new Error(response.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving background settings:", error);
      toast.error("Failed to save background settings");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setSelectedTheme("classic");
    setIntensity("medium");
    setBackgroundEnabled(true);
    
    toast.info("Reset to default settings");
  };

  const getIntensityLabel = (value) => {
    const intensities = ["low", "medium", "high", "ultra"];
    return intensities[value] || "medium";
  };

  const getIntensityValue = (label) => {
    const map = { "low": 0, "medium": 1, "high": 2, "ultra": 3 };
    return map[label] || 1;
  };

  const getIntensityDescription = (intensity) => {
    switch (intensity) {
      case "low": return "Minimal particles, subtle effect";
      case "medium": return "Balanced particles, moderate effect";
      case "high": return "Dense particles, strong effect";
      case "ultra": return "Maximum particles, intense effect";
      default: return "Balanced particles, moderate effect";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading background settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Background Preview */}
      {previewMode && backgroundEnabled && (
        <FuturisticBackground theme={selectedTheme} intensity={intensity} />
      )}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Network className="h-8 w-8" />
              Background Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Customize your network constellation background effect
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={togglePreview}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? "Disable Preview" : "Enable Preview"}
            </Button>
            
            <Button
              variant="outline"
              onClick={resetToDefault}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>

        {/* Preview Alert */}
        {previewMode && (
          <Card className="border-yellow-500 bg-yellow-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-600">
                <Eye className="h-5 w-5" />
                <span className="font-medium">Preview Mode Active</span>
                <span className="text-sm opacity-75">
                  - Changes are temporary until saved
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Theme Selection */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(getThemesByCategory()).map(([category, themes]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    {category} Themes
                  </CardTitle>
                  <CardDescription>
                    {category === "Standard" && "Classic futuristic network themes"}
                    {category === "Tech" && "Technology-inspired network designs"}
                    {category === "Cyberpunk" && "Vibrant cyberpunk network effects"}
                    {category === "Energy" && "High-energy dynamic networks"}
                    {category === "Cool" && "Cool-toned calming networks"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {themes.map((theme) => (
                      <div
                        key={theme.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTheme === theme.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedTheme(theme.id)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{theme.icon}</span>
                          <div>
                            <h3 className="font-semibold">{theme.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {theme.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {theme.description}
                        </p>
                        
                        {/* Color Preview */}
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border shadow-sm"
                            style={{ backgroundColor: theme.color, boxShadow: `0 0 8px ${theme.color}40` }}
                            title={`Theme Color: ${theme.color}`}
                          />
                          <span className="text-xs text-muted-foreground font-mono">
                            {theme.color}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Background Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network Background
              </CardTitle>
              <CardDescription>
                Control the constellation network effect in your gym interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Background */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Enable Background</Label>
                  <p className="text-xs text-muted-foreground">
                    Turn the network background effect on or off
                  </p>
                </div>
                <Switch
                  checked={backgroundEnabled}
                  onCheckedChange={setBackgroundEnabled}
                />
              </div>

              <Separator />

              {/* Intensity Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Effect Intensity
                  </Label>
                  <Badge variant="secondary" className="capitalize">
                    {intensity}
                  </Badge>
                </div>
                
                <div className="px-2">
                  <Slider
                    value={[getIntensityValue(intensity)]}
                    onValueChange={handleIntensityChange}
                    max={3}
                    min={0}
                    step={1}
                    className="w-full"
                    disabled={!backgroundEnabled}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                    <span>Ultra</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {getIntensityDescription(intensity)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Current Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={backgroundEnabled ? "default" : "secondary"}>
                    {backgroundEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Theme</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{availableThemes[selectedTheme]?.icon}</span>
                    <Badge variant="outline">
                      {availableThemes[selectedTheme]?.name}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Intensity</span>
                  <Badge variant="outline" className="capitalize">
                    {intensity}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Color</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ 
                        backgroundColor: availableThemes[selectedTheme]?.color,
                        boxShadow: `0 0 6px ${availableThemes[selectedTheme]?.color}40`
                      }}
                    />
                    <span className="text-xs font-mono">
                      {availableThemes[selectedTheme]?.color}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-center space-y-2">
                <div className="text-4xl mb-2">{availableThemes[selectedTheme]?.icon}</div>
                <h3 className="font-semibold">{availableThemes[selectedTheme]?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {availableThemes[selectedTheme]?.description}
                </p>
              </div>
              
              {!previewMode && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={togglePreview}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Background
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SystemSettings;