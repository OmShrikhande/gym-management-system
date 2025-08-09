/**
 * Predefined themes for the futuristic background system
 * Each theme includes particle configuration and complementary UI colors
 */

export const predefinedThemes = {
  constellation: {
    id: "constellation",
    name: "Constellation",
    description: "Blue glowing nodes with connecting lines - perfect for a professional gym environment",
    particleTheme: "constellation",
    preview: "🌌",
    colors: {
      primary: "#00d4ff",
      secondary: "#0099cc",
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
      card: "rgba(26, 26, 46, 0.8)",
      sidebar: "rgba(22, 33, 62, 0.9)",
      text: "#ffffff",
      accent: "#00d4ff",
    },
    intensity: "medium",
    category: "Professional",
  },
  
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon colors with dynamic animations - energetic and modern",
    particleTheme: "cyberpunk",
    preview: "🌈",
    colors: {
      primary: "#ff0080",
      secondary: "#00ffff",
      background: "linear-gradient(135deg, #0d0d0d 0%, #1a0d1a 50%, #0d1a1a 100%)",
      card: "rgba(26, 13, 26, 0.8)",
      sidebar: "rgba(13, 26, 26, 0.9)",
      text: "#ffffff",
      accent: "#ff8000",
    },
    intensity: "high",
    category: "Energetic",
  },
  
  matrix: {
    id: "matrix",
    name: "Matrix",
    description: "Green digital rain effect - tech-inspired and futuristic",
    particleTheme: "matrix",
    preview: "💚",
    colors: {
      primary: "#00ff41",
      secondary: "#00cc33",
      background: "linear-gradient(135deg, #000000 0%, #001100 50%, #002200 100%)",
      card: "rgba(0, 17, 0, 0.8)",
      sidebar: "rgba(0, 34, 0, 0.9)",
      text: "#00ff41",
      accent: "#00ff41",
    },
    intensity: "medium",
    category: "Tech",
  },
  
  neural: {
    id: "neural",
    name: "Neural Network",
    description: "Blue neural connections with triangular patterns - intelligent and sophisticated",
    particleTheme: "neural",
    preview: "🧠",
    colors: {
      primary: "#4a90e2",
      secondary: "#357abd",
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #2e1a4a 100%)",
      card: "rgba(26, 26, 46, 0.8)",
      sidebar: "rgba(46, 26, 74, 0.9)",
      text: "#ffffff",
      accent: "#4a90e2",
    },
    intensity: "medium",
    category: "Professional",
  },
  
  galaxy: {
    id: "galaxy",
    name: "Galaxy",
    description: "Twinkling stars with cosmic colors - dreamy and inspiring",
    particleTheme: "galaxy",
    preview: "⭐",
    colors: {
      primary: "#ffd700",
      secondary: "#ff69b4",
      background: "linear-gradient(135deg, #000011 0%, #1a0033 50%, #330066 100%)",
      card: "rgba(26, 0, 51, 0.8)",
      sidebar: "rgba(51, 0, 102, 0.9)",
      text: "#ffffff",
      accent: "#00bfff",
    },
    intensity: "high",
    category: "Inspiring",
  },
  
  energy: {
    id: "energy",
    name: "Energy",
    description: "Yellow electric connections - high energy and motivational",
    particleTheme: "energy",
    preview: "⚡",
    colors: {
      primary: "#ffff00",
      secondary: "#ffcc00",
      background: "linear-gradient(135deg, #1a1a00 0%, #333300 50%, #4d4d00 100%)",
      card: "rgba(51, 51, 0, 0.8)",
      sidebar: "rgba(77, 77, 0, 0.9)",
      text: "#ffffff",
      accent: "#ffff00",
    },
    intensity: "high",
    category: "Energetic",
  },
  
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Subtle white particles - clean and distraction-free",
    particleTheme: "minimal",
    preview: "⚪",
    colors: {
      primary: "#ffffff",
      secondary: "#cccccc",
      background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)",
      card: "rgba(45, 45, 45, 0.8)",
      sidebar: "rgba(64, 64, 64, 0.9)",
      text: "#ffffff",
      accent: "#ffffff",
    },
    intensity: "low",
    category: "Professional",
  },
  
  ocean: {
    id: "ocean",
    name: "Ocean Depths",
    description: "Deep blue flowing particles - calming and serene",
    particleTheme: "constellation",
    preview: "🌊",
    colors: {
      primary: "#0077be",
      secondary: "#005577",
      background: "linear-gradient(135deg, #001122 0%, #003344 50%, #004466 100%)",
      card: "rgba(0, 51, 68, 0.8)",
      sidebar: "rgba(0, 68, 102, 0.9)",
      text: "#ffffff",
      accent: "#00aadd",
    },
    intensity: "low",
    category: "Calming",
  },
  
  fire: {
    id: "fire",
    name: "Fire",
    description: "Orange and red particles - passionate and intense",
    particleTheme: "energy",
    preview: "🔥",
    colors: {
      primary: "#ff4500",
      secondary: "#ff6600",
      background: "linear-gradient(135deg, #220000 0%, #441100 50%, #662200 100%)",
      card: "rgba(68, 17, 0, 0.8)",
      sidebar: "rgba(102, 34, 0, 0.9)",
      text: "#ffffff",
      accent: "#ff8800",
    },
    intensity: "high",
    category: "Energetic",
  },
  
  forest: {
    id: "forest",
    name: "Forest",
    description: "Green nature-inspired particles - natural and refreshing",
    particleTheme: "neural",
    preview: "🌲",
    colors: {
      primary: "#228b22",
      secondary: "#32cd32",
      background: "linear-gradient(135deg, #001100 0%, #002200 50%, #003300 100%)",
      card: "rgba(0, 34, 0, 0.8)",
      sidebar: "rgba(0, 51, 0, 0.9)",
      text: "#ffffff",
      accent: "#90ee90",
    },
    intensity: "medium",
    category: "Calming",
  },
};

/**
 * Get theme by ID
 */
export const getThemeById = (themeId) => {
  return predefinedThemes[themeId] || predefinedThemes.constellation;
};

/**
 * Get all themes grouped by category
 */
export const getThemesByCategory = () => {
  const categories = {};
  
  Object.values(predefinedThemes).forEach(theme => {
    if (!categories[theme.category]) {
      categories[theme.category] = [];
    }
    categories[theme.category].push(theme);
  });
  
  return categories;
};

/**
 * Get theme names for dropdown/select components
 */
export const getThemeOptions = () => {
  return Object.values(predefinedThemes).map(theme => ({
    value: theme.id,
    label: theme.name,
    description: theme.description,
    preview: theme.preview,
  }));
};

/**
 * Apply theme colors to CSS variables
 */
export const applyThemeColors = (theme) => {
  if (!theme || !theme.colors) return;
  
  const root = document.documentElement;
  
  // Apply theme colors as CSS variables
  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.style.setProperty('--theme-secondary', theme.colors.secondary);
  root.style.setProperty('--theme-background', theme.colors.background);
  root.style.setProperty('--theme-card', theme.colors.card);
  root.style.setProperty('--theme-sidebar', theme.colors.sidebar);
  root.style.setProperty('--theme-text', theme.colors.text);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  
  // Apply to body background
  document.body.style.background = theme.colors.background;
  document.body.style.color = theme.colors.text;
};

/**
 * Get default theme
 */
export const getDefaultTheme = () => {
  return predefinedThemes.constellation;
};

/**
 * Validate theme object
 */
export const isValidTheme = (theme) => {
  return theme && 
         theme.id && 
         theme.name && 
         theme.particleTheme && 
         theme.colors &&
         theme.colors.primary &&
         theme.colors.background;
};