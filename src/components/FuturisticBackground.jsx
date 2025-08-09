import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

/**
 * FuturisticBackground Component
 * Creates a network/constellation background with various futuristic themes
 */
const FuturisticBackground = ({ theme = "classic", intensity = "medium" }) => {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    console.log("Network particles loaded:", container);
  }, []);

  // Predefined futuristic themes
  const getThemeConfig = (themeName) => {
    const themes = {
      classic: {
        color: "#00d4ff",
        name: "Classic Network",
        description: "Electric blue network with clean connections",
      },
      matrix: {
        color: "#00ff41",
        name: "Cyber Matrix",
        description: "Classic green matrix-style network",
      },
      neon: {
        color: "#ff00ff",
        name: "Neon Purple",
        description: "Vibrant purple cyberpunk network",
      },
      golden: {
        color: "#ffd700",
        name: "Golden Energy",
        description: "Warm golden energy network",
      },
      ice: {
        color: "#00ffff",
        name: "Ice Blue",
        description: "Cool ice blue constellation",
      },
      fire: {
        color: "#ff4500",
        name: "Fire Network",
        description: "Energetic orange-red network",
      },
      plasma: {
        color: "#9d4edd",
        name: "Plasma Field",
        description: "Electric purple plasma network",
      },
      emerald: {
        color: "#50c878",
        name: "Emerald Grid",
        description: "Sophisticated emerald network",
      },
    };
    
    return themes[themeName] || themes.classic;
  };

  // Intensity configuration
  const getIntensityConfig = (intensity) => {
    const configs = {
      low: {
        particleCount: 40,
        speed: 0.5,
        linkDistance: 120,
        linkOpacity: 0.2,
        particleOpacity: 0.4,
      },
      medium: {
        particleCount: 80,
        speed: 1,
        linkDistance: 150,
        linkOpacity: 0.3,
        particleOpacity: 0.6,
      },
      high: {
        particleCount: 120,
        speed: 1.5,
        linkDistance: 180,
        linkOpacity: 0.4,
        particleOpacity: 0.8,
      },
      ultra: {
        particleCount: 160,
        speed: 2,
        linkDistance: 200,
        linkOpacity: 0.5,
        particleOpacity: 1,
      },
    };
    
    return configs[intensity] || configs.medium;
  };

  const themeConfig = getThemeConfig(theme);
  const config = getIntensityConfig(intensity);

  // Network/Constellation particle configuration
  const particleConfig = {
    background: {
      color: {
        value: "transparent",
      },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: {
          enable: true,
          mode: "push",
        },
        onHover: {
          enable: true,
          mode: "grab",
        },
        resize: true,
      },
      modes: {
        push: {
          quantity: 3,
        },
        grab: {
          distance: 200,
          links: {
            opacity: 0.8,
          },
        },
      },
    },
    particles: {
      color: {
        value: themeConfig.color,
      },
      links: {
        color: themeConfig.color,
        distance: config.linkDistance,
        enable: true,
        opacity: config.linkOpacity,
        width: 1.5,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: {
          default: "bounce",
        },
        random: true,
        speed: config.speed,
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: config.particleCount,
      },
      opacity: {
        value: config.particleOpacity,
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0.3,
          sync: false,
        },
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1.5, max: 4 },
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 1,
          sync: false,
        },
      },
      // Add glow effect
      shadow: {
        enable: true,
        color: themeConfig.color,
        blur: 10,
      },
    },
    detectRetina: true,
  };

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Particles
        id="network-background"
        init={particlesInit}
        loaded={particlesLoaded}
        options={particleConfig}
        className="w-full h-full"
      />
    </div>
  );
};

// Export available themes for settings
export const availableThemes = {
  classic: {
    id: "classic",
    color: "#00d4ff",
    name: "Classic Network",
    description: "Electric blue network with clean connections",
    category: "Standard",
    icon: "🔷",
  },
  matrix: {
    id: "matrix",
    color: "#00ff41",
    name: "Cyber Matrix",
    description: "Classic green matrix-style network",
    category: "Tech",
    icon: "💚",
  },
  neon: {
    id: "neon",
    color: "#ff00ff",
    name: "Neon Purple",
    description: "Vibrant purple cyberpunk network",
    category: "Cyberpunk",
    icon: "💜",
  },
  golden: {
    id: "golden",
    color: "#ffd700",
    name: "Golden Energy",
    description: "Warm golden energy network",
    category: "Energy",
    icon: "💛",
  },
  ice: {
    id: "ice",
    color: "#00ffff",
    name: "Ice Blue",
    description: "Cool ice blue constellation",
    category: "Cool",
    icon: "🔵",
  },
  fire: {
    id: "fire",
    color: "#ff4500",
    name: "Fire Network",
    description: "Energetic orange-red network",
    category: "Energy",
    icon: "🔥",
  },
  plasma: {
    id: "plasma",
    color: "#9d4edd",
    name: "Plasma Field",
    description: "Electric purple plasma network",
    category: "Tech",
    icon: "⚡",
  },
  emerald: {
    id: "emerald",
    color: "#50c878",
    name: "Emerald Grid",
    description: "Sophisticated emerald network",
    category: "Standard",
    icon: "💎",
  },
};

export const getThemesByCategory = () => {
  const categories = {};
  Object.values(availableThemes).forEach(theme => {
    if (!categories[theme.category]) {
      categories[theme.category] = [];
    }
    categories[theme.category].push(theme);
  });
  return categories;
};

export default FuturisticBackground;