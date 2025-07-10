// Test script to verify gym branding functionality
// This can be run in the browser console for testing

const testGymBranding = () => {
  console.log('Testing Gym Branding Functionality...');
  
  // Test 1: Check if useGymBranding hook is available
  console.log('1. Testing hook availability...');
  
  // Test 2: Check localStorage structure
  console.log('2. Checking localStorage structure...');
  const keys = Object.keys(localStorage).filter(key => key.includes('gym_settings'));
  console.log('Found settings keys:', keys);
  
  // Test 3: Check if settings are properly formatted
  console.log('3. Checking settings format...');
  keys.forEach(key => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      console.log(`${key}:`, {
        hasGlobal: !!value.global,
        hasBranding: !!value.branding,
        appName: value.global?.appName,
        logoUrl: value.branding?.logoUrl,
        primaryColor: value.branding?.primaryColor
      });
    } catch (e) {
      console.error(`Error parsing ${key}:`, e);
    }
  });
  
  // Test 4: Check if CSS variables are applied
  console.log('4. Checking CSS variables...');
  const root = document.documentElement;
  const primaryColor = getComputedStyle(root).getPropertyValue('--primary');
  const secondaryColor = getComputedStyle(root).getPropertyValue('--secondary');
  console.log('CSS Variables:', {
    primary: primaryColor,
    secondary: secondaryColor
  });
  
  // Test 5: Check if branding components are rendered
  console.log('5. Checking rendered components...');
  const headerTitle = document.querySelector('h1');
  const headerSubtitle = document.querySelector('p');
  console.log('Header elements:', {
    title: headerTitle?.textContent,
    subtitle: headerSubtitle?.textContent
  });
  
  console.log('Gym Branding Test Complete!');
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testGymBranding = testGymBranding;
}

console.log('Gym Branding Test Script Loaded. Run testGymBranding() to test.');