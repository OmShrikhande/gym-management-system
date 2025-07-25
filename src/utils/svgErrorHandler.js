/**
 * SVG Error Handler Utility
 * Fixes common SVG attribute errors and warnings
 */

/**
 * Fix SVG elements with invalid width/height attributes
 */
export const fixSVGAttributes = () => {
  // Find all SVG elements with invalid width/height attributes
  const svgElements = document.querySelectorAll('svg');
  
  svgElements.forEach(svg => {
    // Fix width attribute
    const width = svg.getAttribute('width');
    if (width === 'auto' || width === '' || width === null) {
      svg.removeAttribute('width');
      if (!svg.style.width) {
        svg.style.width = '100%';
      }
    }
    
    // Fix height attribute
    const height = svg.getAttribute('height');
    if (height === 'auto' || height === '' || height === null) {
      svg.removeAttribute('height');
      if (!svg.style.height) {
        svg.style.height = 'auto';
      }
    }
    
    // Ensure viewBox is present for scalability
    if (!svg.getAttribute('viewBox') && svg.getBBox) {
      try {
        const bbox = svg.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          svg.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);
        }
      } catch (error) {
        // Ignore getBBox errors (common in some browsers)
      }
    }
  });
};

/**
 * Set up a MutationObserver to fix SVG attributes as they're added to the DOM
 */
export const initializeSVGAttributeFixer = () => {
  // Create a MutationObserver to watch for new SVG elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the added node is an SVG or contains SVGs
          if (node.tagName === 'SVG') {
            fixSingleSVG(node);
          } else if (node.querySelectorAll) {
            const svgs = node.querySelectorAll('svg');
            svgs.forEach(fixSingleSVG);
          }
        }
      });
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Fix existing SVGs
  fixSVGAttributes();
  
  console.log('🎨 SVG attribute fixer initialized');
  
  return observer;
};

/**
 * Fix a single SVG element
 */
const fixSingleSVG = (svg) => {
  try {
    // Fix width attribute
    const width = svg.getAttribute('width');
    if (width === 'auto' || width === '' || width === null) {
      svg.removeAttribute('width');
      if (!svg.style.width) {
        svg.style.width = '100%';
      }
    }
    
    // Fix height attribute
    const height = svg.getAttribute('height');
    if (height === 'auto' || height === '' || height === null) {
      svg.removeAttribute('height');
      if (!svg.style.height) {
        svg.style.height = 'auto';
      }
    }
    
    // Add preserveAspectRatio if not present
    if (!svg.getAttribute('preserveAspectRatio')) {
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
    
    // Ensure proper namespace
    if (!svg.getAttribute('xmlns')) {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
  } catch (error) {
    // Silently ignore errors when fixing individual SVGs
  }
};

/**
 * Create a safe SVG element with proper attributes
 */
export const createSafeSVG = (attributes = {}) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  
  // Set default attributes
  const defaultAttributes = {
    xmlns: 'http://www.w3.org/2000/svg',
    preserveAspectRatio: 'xMidYMid meet',
    ...attributes
  };
  
  Object.entries(defaultAttributes).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Skip invalid width/height values
      if ((key === 'width' || key === 'height') && value === 'auto') {
        return;
      }
      svg.setAttribute(key, value);
    }
  });
  
  return svg;
};

/**
 * Wrap SVG content in a safe container
 */
export const wrapSVGSafely = (svgContent, containerProps = {}) => {
  const container = document.createElement('div');
  container.className = 'svg-container';
  
  // Apply container styles
  Object.assign(container.style, {
    display: 'inline-block',
    lineHeight: 0,
    ...containerProps.style
  });
  
  // Set container attributes
  Object.entries(containerProps).forEach(([key, value]) => {
    if (key !== 'style' && value !== null && value !== undefined) {
      container.setAttribute(key, value);
    }
  });
  
  container.innerHTML = svgContent;
  
  // Fix any SVGs in the container
  const svgs = container.querySelectorAll('svg');
  svgs.forEach(fixSingleSVG);
  
  return container;
};

/**
 * Override console.error to suppress SVG attribute warnings
 */
export const suppressSVGAttributeWarnings = () => {
  const originalConsoleError = console.error;
  
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Check if it's an SVG attribute warning
    const isSVGAttributeWarning = /svg.*attribute.*(width|height).*Expected length.*auto/i.test(message);
    
    if (!isSVGAttributeWarning) {
      originalConsoleError.apply(console, args);
    }
  };
};

/**
 * Initialize all SVG error handling
 */
export const initializeSVGErrorHandling = () => {
  // Fix existing SVGs
  fixSVGAttributes();
  
  // Set up observer for new SVGs
  const observer = initializeSVGAttributeFixer();
  
  // Suppress console warnings
  suppressSVGAttributeWarnings();
  
  // Run fixer periodically to catch any missed SVGs
  const intervalId = setInterval(() => {
    fixSVGAttributes();
  }, 5000);
  
  console.log('🎨 Complete SVG error handling initialized');
  
  return {
    observer,
    intervalId,
    cleanup: () => {
      observer.disconnect();
      clearInterval(intervalId);
    }
  };
};

export default {
  fixSVGAttributes,
  initializeSVGAttributeFixer,
  createSafeSVG,
  wrapSVGSafely,
  suppressSVGAttributeWarnings,
  initializeSVGErrorHandling
};