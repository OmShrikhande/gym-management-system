import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, 
  Upload, 
  Download, 
  RefreshCw, 
  Eye, 
  Save, 
  RotateCcw, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Link2,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { applySettings } from "@/lib/settings";
import { debounce } from "lodash";

// Predefined color schemes
const PRESET_THEMES = {
  default: {
    name: "Default Blue",
    primaryColor: "#3B82F6",
    secondaryColor: "#8B5CF6",
    backgroundColor: "#111827",
    cardColor: "#1F2937",
    sidebarColor: "#1F2937",
    textColor: "#FFFFFF",
    accentColor: "#06B6D4"
  },
  modern: {
    name: "Modern Dark",
    primaryColor: "#10B981",
    secondaryColor: "#F59E0B",
    backgroundColor: "#0F172A",
    cardColor: "#1E293B",
    sidebarColor: "#1E293B",
    textColor: "#F8FAFC",
    accentColor: "#EC4899"
  },
  professional: {
    name: "Professional",
    primaryColor: "#2563EB",
    secondaryColor: "#7C3AED",
    backgroundColor: "#1F2937",
    cardColor: "#374151",
    sidebarColor: "#374151",
    textColor: "#F9FAFB",
    accentColor: "#EF4444"
  },
  warm: {
    name: "Warm Orange",
    primaryColor: "#EA580C",
    secondaryColor: "#DC2626",
    backgroundColor: "#1C1917",
    cardColor: "#292524",
    sidebarColor: "#292524",
    textColor: "#FAFAF9",
    accentColor: "#FBBF24"
  },
  nature: {
    name: "Nature Green",
    primaryColor: "#059669",
    secondaryColor: "#0D9488",
    backgroundColor: "#164E63",
    cardColor: "#1E40AF",
    sidebarColor: "#1E40AF",
    textColor: "#F0F9FF",
    accentColor: "#84CC16"
  },
  purple: {
    name: "Purple Dream",
    primaryColor: "#7C3AED",
    secondaryColor: "#A855F7",
    backgroundColor: "#1E1B4B",
    cardColor: "#312E81",
    sidebarColor: "#312E81",
    textColor: "#F3F4F6",
    accentColor: "#EC4899"
  }
};

const GymCustomization = () => {
  const { user, authFetch, isGymOwner } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Form state
  const [customization, setCustomization] = useState({
    branding: {
      gymName: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      backgroundColor: '#111827',
      cardColor: '#1F2937',
      sidebarColor: '#1F2937',
      textColor: '#FFFFFF',
      accentColor: '#06B6D4',
      logo: '',
      favicon: '',
      darkMode: true
    },
    settings: {
      allowMemberCustomization: false,
      allowTrainerCustomization: false,
      customCss: ''
    }
  });
  
  // Original state for reset functionality
  const [originalCustomization, setOriginalCustomization] = useState(null);
  
  // Validate customization data before sending
  const validateCustomizationData = (data) => {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Invalid customization data structure');
      return errors;
    }
    
    if (!data.branding || typeof data.branding !== 'object') {
      errors.push('Missing or invalid branding data');
      return errors;
    }
    
    // Validate color fields
    const colorRegex = /^#[0-9A-F]{6}$/i;
    const colorFields = ['primaryColor', 'secondaryColor', 'backgroundColor', 'cardColor', 'sidebarColor', 'textColor', 'accentColor'];
    
    colorFields.forEach(field => {
      if (data.branding[field] && !colorRegex.test(data.branding[field])) {
        errors.push(`${field} must be a valid hex color`);
      }
    });
    
    return errors;
  };

  // Debounced save function
  const debouncedSave = useRef(
    debounce(async (data) => {
      if (!user?.gymId && !isGymOwner) return;
      
      // Validate data before sending
      const validationErrors = validateCustomizationData(data);
      if (validationErrors.length > 0) {
        console.error('Validation errors:', validationErrors);
        toast.error(`Validation failed: ${validationErrors.join(', ')}`);
        return;
      }
      
      try {
        setIsSaving(true);
        setSaveStatus(null);
        
        const response = await authFetch(`/gym/${user.gymId || user._id}/customization`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (response.success) {
          setSaveStatus('success');
          toast.success('Customization saved successfully!');
          
          // Apply settings to current user
          applySettings(data, user._id);
          
          // Broadcast changes to other users in the same gym
          if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('gym-customization');
            channel.postMessage({
              type: 'customization-updated',
              gymId: user.gymId || user._id,
              customization: data
            });
          }
        } else {
          console.error('Save failed with response:', response);
          throw new Error(response.message || 'Failed to save customization');
        }
      } catch (error) {
        console.error('Error saving customization:', error);
        setSaveStatus('error');
        
        // Show more specific error messages
        if (error.message.includes('Authentication')) {
          toast.error('Authentication error. Please login again.');
        } else if (error.message.includes('Permission')) {
          toast.error('You do not have permission to save customization.');
        } else if (error.message.includes('Validation')) {
          toast.error('Invalid customization data. Please check your inputs.');
        } else {
          toast.error(`Failed to save customization: ${error.message}`);
        }
      } finally {
        setIsSaving(false);
      }
    }, 1000)
  );
  
  // Debounced color change function
  const debouncedColorChange = useRef(
    debounce(async (colorData) => {
      if (!previewMode) {
        // Apply changes immediately for preview
        const tempSettings = {
          ...customization,
          branding: {
            ...customization.branding,
            ...colorData
          }
        };
        
        applySettings(tempSettings, user._id);
        
        // Save to backend
        debouncedSave.current(tempSettings);
      }
    }, 300)
  );
  
  // Load gym customization
  const loadCustomization = useCallback(async () => {
    if (!user?.gymId && !isGymOwner) return;
    
    try {
      setIsLoading(true);
      
      const response = await authFetch(`/gym/${user.gymId || user._id}/customization`);
      
      if (response.success && response.data) {
        const loadedCustomization = response.data;
        setCustomization(loadedCustomization);
        setOriginalCustomization(loadedCustomization);
        
        // Apply settings
        applySettings(loadedCustomization, user._id);
      } else {
        // Set default values if no customization exists
        setOriginalCustomization(customization);
      }
    } catch (error) {
      console.error('Error loading customization:', error);
      toast.error('Failed to load gym customization');
    } finally {
      setIsLoading(false);
    }
  }, [user, isGymOwner, authFetch]);
  
  // Load customization on component mount
  useEffect(() => {
    loadCustomization();
  }, [loadCustomization]);
  
  // Handle color changes
  const handleColorChange = useCallback((colorType, value) => {
    const newCustomization = {
      ...customization,
      branding: {
        ...customization.branding,
        [colorType]: value
      }
    };
    
    setCustomization(newCustomization);
    
    // Apply preview if not in preview mode
    if (!previewMode) {
      debouncedColorChange.current({ [colorType]: value });
    }
  }, [customization, previewMode]);
  
  // Handle preset theme application
  const applyPresetTheme = useCallback((themeKey) => {
    const theme = PRESET_THEMES[themeKey];
    if (!theme) return;
    
    const newCustomization = {
      ...customization,
      branding: {
        ...customization.branding,
        ...theme
      }
    };
    
    setCustomization(newCustomization);
    
    // Apply settings immediately
    applySettings(newCustomization, user._id);
    
    // Save to backend
    debouncedSave.current(newCustomization);
    
    toast.success(`Applied ${theme.name} theme`);
  }, [customization, user, debouncedSave]);
  
  // Handle logo/favicon upload
  const handleFileUpload = useCallback(async (file, type) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = type === 'favicon' 
      ? ['image/x-icon', 'image/png', 'image/jpeg']
      : ['image/png', 'image/jpeg', 'image/svg+xml'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a valid image.');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size too large. Please upload a file smaller than 2MB.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await authFetch(`/gym/${user.gymId || user._id}/upload-asset`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.success) {
        const newCustomization = {
          ...customization,
          branding: {
            ...customization.branding,
            [type]: response.data.url
          }
        };
        
        setCustomization(newCustomization);
        debouncedSave.current(newCustomization);
        
        toast.success(`${type === 'favicon' ? 'Favicon' : 'Logo'} uploaded successfully!`);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  }, [user, customization, authFetch, debouncedSave]);
  
  // Handle URL input for logo/favicon
  const handleUrlChange = useCallback((type, url) => {
    const newCustomization = {
      ...customization,
      branding: {
        ...customization.branding,
        [type]: url
      }
    };
    
    setCustomization(newCustomization);
    
    // Debounced save for URL changes
    debouncedSave.current(newCustomization);
  }, [customization, debouncedSave]);
  
  // Reset to original settings
  const resetToOriginal = useCallback(() => {
    if (originalCustomization) {
      setCustomization(originalCustomization);
      applySettings(originalCustomization, user._id);
      debouncedSave.current(originalCustomization);
      toast.success('Settings reset to original');
    }
  }, [originalCustomization, user, debouncedSave]);
  
  // Export customization
  const exportCustomization = useCallback(() => {
    const dataStr = JSON.stringify(customization, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `gym-customization-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Customization exported successfully!');
  }, [customization]);
  
  // Import customization
  const importCustomization = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        setCustomization(importedData);
        applySettings(importedData, user._id);
        debouncedSave.current(importedData);
        toast.success('Customization imported successfully!');
      } catch (error) {
        toast.error('Invalid customization file');
      }
    };
    reader.readAsText(file);
  }, [user, debouncedSave]);
  
  // Toggle preview mode
  const togglePreviewMode = useCallback(() => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      // Entering preview mode - apply current settings
      applySettings(customization, user._id);
    } else {
      // Exiting preview mode - apply original settings
      if (originalCustomization) {
        applySettings(originalCustomization, user._id);
      }
    }
  }, [previewMode, customization, originalCustomization, user]);
  
  // Save current customization
  const saveCustomization = useCallback(async () => {
    // Validate data before sending
    const validationErrors = validateCustomizationData(customization);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      toast.error(`Validation failed: ${validationErrors.join(', ')}`);
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveStatus(null);
      
      const response = await authFetch(`/gym/${user.gymId || user._id}/customization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customization),
      });
      
      if (response.success) {
        setOriginalCustomization(customization);
        setSaveStatus('success');
        toast.success('Customization saved successfully!');
        
        // Apply settings
        applySettings(customization, user._id);
        
        // Broadcast changes
        if (window.BroadcastChannel) {
          const channel = new BroadcastChannel('gym-customization');
          channel.postMessage({
            type: 'customization-updated',
            gymId: user.gymId || user._id,
            customization
          });
        }
      } else {
        console.error('Save failed with response:', response);
        throw new Error(response.message || 'Failed to save customization');
      }
    } catch (error) {
      console.error('Error saving customization:', error);
      setSaveStatus('error');
      
      // Show more specific error messages
      if (error.message.includes('Authentication')) {
        toast.error('Authentication error. Please login again.');
      } else if (error.message.includes('Permission')) {
        toast.error('You do not have permission to save customization.');
      } else if (error.message.includes('Validation')) {
        toast.error('Invalid customization data. Please check your inputs.');
      } else {
        toast.error(`Failed to save customization: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  }, [customization, user, authFetch]);
  
  if (!isGymOwner) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">Only gym owners can customize their gym's appearance.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gym Customization</h2>
          <p className="text-gray-400 mt-1">Customize your gym's appearance for all members and trainers</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Save Status */}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Saved</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Save failed</span>
            </div>
          )}
          
          {isSaving && (
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <Button
            variant="outline"
            onClick={togglePreviewMode}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Exit Preview' : 'Preview'}
          </Button>
          
          <Button
            onClick={saveCustomization}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
      
      {/* Preview Mode Banner */}
      {previewMode && (
        <div className="bg-yellow-600/20 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <Eye className="h-5 w-5" />
            <span className="font-medium">Preview Mode Active</span>
          </div>
          <p className="text-yellow-200 text-sm mt-1">
            You are currently previewing changes. Click "Exit Preview" to return to the original settings.
          </p>
        </div>
      )}
      
      {/* Main Content */}
      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="colors" className="data-[state=active]:bg-blue-600">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="branding" className="data-[state=active]:bg-blue-600">
            <Upload className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
            <Monitor className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-blue-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>
        
        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          {/* Preset Themes */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Preset Themes</CardTitle>
              <CardDescription className="text-gray-400">
                Choose from our carefully crafted themes or customize your own
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(PRESET_THEMES).map(([key, theme]) => (
                  <div
                    key={key}
                    className="p-4 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
                    onClick={() => applyPresetTheme(key)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex gap-1">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.secondaryColor }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                      </div>
                      <span className="text-white font-medium">{theme.name}</span>
                    </div>
                    <div 
                      className="h-16 rounded border border-gray-600 flex items-center justify-center"
                      style={{ backgroundColor: theme.backgroundColor }}
                    >
                      <div 
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: theme.cardColor }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Custom Colors */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Custom Colors</CardTitle>
              <CardDescription className="text-gray-400">
                Customize individual colors to match your gym's brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Primary Color */}
                <div className="space-y-2">
                  <Label className="text-white">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={customization.branding.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="w-12 h-12 p-1 border-gray-600 bg-gray-700"
                    />
                    <Input
                      type="text"
                      value={customization.branding.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                
                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label className="text-white">Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={customization.branding.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="w-12 h-12 p-1 border-gray-600 bg-gray-700"
                    />
                    <Input
                      type="text"
                      value={customization.branding.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="#8B5CF6"
                    />
                  </div>
                </div>
                
                {/* Accent Color */}
                <div className="space-y-2">
                  <Label className="text-white">Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={customization.branding.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      className="w-12 h-12 p-1 border-gray-600 bg-gray-700"
                    />
                    <Input
                      type="text"
                      value={customization.branding.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="#06B6D4"
                    />
                  </div>
                </div>
                
                {/* Background Color */}
                <div className="space-y-2">
                  <Label className="text-white">Background Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={customization.branding.backgroundColor}
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      className="w-12 h-12 p-1 border-gray-600 bg-gray-700"
                    />
                    <Input
                      type="text"
                      value={customization.branding.backgroundColor}
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="#111827"
                    />
                  </div>
                </div>
                
                {/* Card Color */}
                <div className="space-y-2">
                  <Label className="text-white">Card Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={customization.branding.cardColor}
                      onChange={(e) => handleColorChange('cardColor', e.target.value)}
                      className="w-12 h-12 p-1 border-gray-600 bg-gray-700"
                    />
                    <Input
                      type="text"
                      value={customization.branding.cardColor}
                      onChange={(e) => handleColorChange('cardColor', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="#1F2937"
                    />
                  </div>
                </div>
                
                {/* Sidebar Color */}
                <div className="space-y-2">
                  <Label className="text-white">Sidebar Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={customization.branding.sidebarColor}
                      onChange={(e) => handleColorChange('sidebarColor', e.target.value)}
                      className="w-12 h-12 p-1 border-gray-600 bg-gray-700"
                    />
                    <Input
                      type="text"
                      value={customization.branding.sidebarColor}
                      onChange={(e) => handleColorChange('sidebarColor', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="#1F2937"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Gym Branding</CardTitle>
              <CardDescription className="text-gray-400">
                Upload your gym's logo and favicon, or use URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gym Name */}
              <div className="space-y-2">
                <Label className="text-white">Gym Name</Label>
                <Input
                  type="text"
                  value={customization.branding.gymName}
                  onChange={(e) => {
                    const newCustomization = {
                      ...customization,
                      branding: {
                        ...customization.branding,
                        gymName: e.target.value
                      }
                    };
                    setCustomization(newCustomization);
                    debouncedSave.current(newCustomization);
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter your gym name"
                />
              </div>
              
              {/* Logo Upload */}
              <div className="space-y-4">
                <Label className="text-white">Gym Logo</Label>
                
                <div className="flex items-center gap-4">
                  {customization.branding.logo && (
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
                      <img 
                        src={customization.branding.logo} 
                        alt="Gym Logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload').click()}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'logo')}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-gray-400" />
                      <Input
                        type="url"
                        value={customization.branding.logo}
                        onChange={(e) => handleUrlChange('logo', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Or enter logo URL"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Favicon Upload */}
              <div className="space-y-4">
                <Label className="text-white">Favicon</Label>
                
                <div className="flex items-center gap-4">
                  {customization.branding.favicon && (
                    <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center border border-gray-600">
                      <img 
                        src={customization.branding.favicon} 
                        alt="Favicon"
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('favicon-upload').click()}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Favicon
                      </Button>
                      <input
                        id="favicon-upload"
                        type="file"
                        accept="image/x-icon,image/png,image/jpeg"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'favicon')}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-gray-400" />
                      <Input
                        type="url"
                        value={customization.branding.favicon}
                        onChange={(e) => handleUrlChange('favicon', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Or enter favicon URL"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Customization Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Control who can see and modify the gym's appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Allow Member Customization</Label>
                  <p className="text-gray-400 text-sm mt-1">
                    Allow members to customize their personal dashboard colors
                  </p>
                </div>
                <Switch
                  checked={customization.settings.allowMemberCustomization}
                  onCheckedChange={(checked) => {
                    const newCustomization = {
                      ...customization,
                      settings: {
                        ...customization.settings,
                        allowMemberCustomization: checked
                      }
                    };
                    setCustomization(newCustomization);
                    debouncedSave.current(newCustomization);
                  }}
                />
              </div>
              
              <Separator className="bg-gray-700" />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Allow Trainer Customization</Label>
                  <p className="text-gray-400 text-sm mt-1">
                    Allow trainers to customize their personal dashboard colors
                  </p>
                </div>
                <Switch
                  checked={customization.settings.allowTrainerCustomization}
                  onCheckedChange={(checked) => {
                    const newCustomization = {
                      ...customization,
                      settings: {
                        ...customization.settings,
                        allowTrainerCustomization: checked
                      }
                    };
                    setCustomization(newCustomization);
                    debouncedSave.current(newCustomization);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Advanced Options</CardTitle>
              <CardDescription className="text-gray-400">
                Import, export, and reset your customization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={exportCustomization}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                
                <Button
                  onClick={() => document.getElementById('import-settings').click()}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </Button>
                <input
                  id="import-settings"
                  type="file"
                  accept=".json"
                  onChange={importCustomization}
                  className="hidden"
                />
                
                <Button
                  onClick={resetToOriginal}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Original
                </Button>
              </div>
              
              <Separator className="bg-gray-700" />
              
              {/* Custom CSS */}
              <div className="space-y-4">
                <Label className="text-white">Custom CSS</Label>
                <p className="text-gray-400 text-sm">
                  Add custom CSS to further customize your gym's appearance. Use with caution.
                </p>
                <textarea
                  value={customization.settings.customCss}
                  onChange={(e) => {
                    const newCustomization = {
                      ...customization,
                      settings: {
                        ...customization.settings,
                        customCss: e.target.value
                      }
                    };
                    setCustomization(newCustomization);
                    debouncedSave.current(newCustomization);
                  }}
                  className="w-full h-32 bg-gray-700 border-gray-600 rounded-md p-3 text-white font-mono text-sm"
                  placeholder="/* Add your custom CSS here */"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GymCustomization;