export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up any global resources
  // Close database connections, clear caches, etc.
  
  console.log('✅ Test cleanup complete');
}