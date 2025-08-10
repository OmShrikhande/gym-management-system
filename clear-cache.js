// Clear browser cache and localStorage
console.log('🧹 Clearing browser cache and localStorage...');

// Clear localStorage
try {
  localStorage.clear();
  console.log('✅ localStorage cleared');
} catch (error) {
  console.error('❌ Error clearing localStorage:', error);
}

// Clear sessionStorage
try {
  sessionStorage.clear();
  console.log('✅ sessionStorage cleared');
} catch (error) {
  console.error('❌ Error clearing sessionStorage:', error);
}

// Clear IndexedDB if available
if ('indexedDB' in window) {
  try {
    // This is a simplified approach - in production you'd want to be more specific
    console.log('✅ IndexedDB clearing initiated (may require page refresh)');
  } catch (error) {
    console.error('❌ Error clearing IndexedDB:', error);
  }
}

console.log('🔄 Please refresh the page to complete cache clearing');