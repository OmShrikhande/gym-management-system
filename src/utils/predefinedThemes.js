export const predefinedThemes = {
  futuristicBlue: {
    name: "Futuristic Blue",
    description: "A modern blue theme with constellation background",
    preview: "#1E40AF",
    settings: {
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      backgroundColor: "#0F172A",
      cardColor: "#1E293B",
      sidebarColor: "#1E293B",
      textColor: "#F8FAFC",
      darkMode: true,
      futuristicBackground: {
        enabled: true,
        theme: "blue",
        intensity: "medium"
      }
    }
  },
  futuristicPurple: {
    name: "Futuristic Purple",
    description: "A vibrant purple theme with constellation background",
    preview: "#7C3AED",
    settings: {
      primaryColor: "#8B5CF6",
      secondaryColor: "#7C3AED",
      backgroundColor: "#1E1B4B",
      cardColor: "#312E81",
      sidebarColor: "#312E81",
      textColor: "#F8FAFC",
      darkMode: true,
      futuristicBackground: {
        enabled: true,
        theme: "purple",
        intensity: "medium"
      }
    }
  },
  futuristicCyan: {
    name: "Futuristic Cyan",
    description: "A cool cyan theme with constellation background",
    preview: "#0891B2",
    settings: {
      primaryColor: "#06B6D4",
      secondaryColor: "#0891B2",
      backgroundColor: "#164E63",
      cardColor: "#0F3460",
      sidebarColor: "#0F3460",
      textColor: "#F0F9FF",
      darkMode: true,
      futuristicBackground: {
        enabled: true,
        theme: "cyan",
        intensity: "medium"
      }
    }
  },
  futuristicGreen: {
    name: "Futuristic Green",
    description: "A tech-inspired green theme with constellation background",
    preview: "#059669",
    settings: {
      primaryColor: "#10B981",
      secondaryColor: "#059669",
      backgroundColor: "#064E3B",
      cardColor: "#065F46",
      sidebarColor: "#065F46",
      textColor: "#ECFDF5",
      darkMode: true,
      futuristicBackground: {
        enabled: true,
        theme: "green",
        intensity: "medium"
      }
    }
  },
  classicDark: {
    name: "Classic Dark",
    description: "Traditional dark theme without background effects",
    preview: "#374151",
    settings: {
      primaryColor: "#3B82F6",
      secondaryColor: "#8B5CF6",
      backgroundColor: "#111827",
      cardColor: "#1F2937",
      sidebarColor: "#1F2937",
      textColor: "#FFFFFF",
      darkMode: true,
      futuristicBackground: {
        enabled: false,
        theme: "blue",
        intensity: "medium"
      }
    }
  },
  classicLight: {
    name: "Classic Light",
    description: "Clean light theme for daytime use",
    preview: "#F3F4F6",
    settings: {
      primaryColor: "#3B82F6",
      secondaryColor: "#8B5CF6",
      backgroundColor: "#FFFFFF",
      cardColor: "#F9FAFB",
      sidebarColor: "#F3F4F6",
      textColor: "#111827",
      darkMode: false,
      futuristicBackground: {
        enabled: false,
        theme: "blue",
        intensity: "medium"
      }
    }
  }
};

export const getDefaultTheme = () => predefinedThemes.futuristicBlue;