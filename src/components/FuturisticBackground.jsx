import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadStarsPreset } from "tsparticles-preset-stars";

const FuturisticBackground = ({ theme = "blue", intensity = "medium" }) => {
  const particlesInit = useCallback(async (engine) => {
    await loadStarsPreset(engine);
  }, []);

  const getParticleConfig = () => {
    const baseConfig = {
      preset: "stars",
      background: {
        opacity: 0
      },
      particles: {
        color: {
          value: theme === "blue" ? "#3B82F6" : 
                 theme === "purple" ? "#8B5CF6" : 
                 theme === "cyan" ? "#06B6D4" : 
                 theme === "green" ? "#10B981" : "#3B82F6"
        },
        links: {
          color: theme === "blue" ? "#3B82F6" : 
                 theme === "purple" ? "#8B5CF6" : 
                 theme === "cyan" ? "#06B6D4" : 
                 theme === "green" ? "#10B981" : "#3B82F6",
          distance: intensity === "low" ? 200 : intensity === "high" ? 120 : 150,
          enable: true,
          opacity: intensity === "low" ? 0.3 : intensity === "high" ? 0.7 : 0.5,
          width: 1
        },
        move: {
          enable: true,
          speed: intensity === "low" ? 0.5 : intensity === "high" ? 2 : 1,
          direction: "none",
          random: false,
          straight: false,
          outModes: {
            default: "bounce"
          }
        },
        number: {
          density: {
            enable: true,
            area: intensity === "low" ? 1200 : intensity === "high" ? 600 : 800
          },
          value: intensity === "low" ? 50 : intensity === "high" ? 120 : 80
        },
        opacity: {
          value: intensity === "low" ? 0.4 : intensity === "high" ? 0.8 : 0.6
        },
        shape: {
          type: "circle"
        },
        size: {
          value: { min: 1, max: intensity === "low" ? 2 : intensity === "high" ? 4 : 3 }
        }
      },
      detectRetina: true
    };

    return baseConfig;
  };

  return (
    <Particles
      id="futuristic-background"
      init={particlesInit}
      options={getParticleConfig()}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none"
      }}
    />
  );
};

export default FuturisticBackground;