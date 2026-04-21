export default async function globalSetup() {
  console.log('🧪 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '8081'; // Different port for tests
  process.env.LOG_LEVEL = 'error';
  
  // Mock Supabase URLs for testing
  if (!process.env.SUPABASE_URL) {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
  }
  if (!process.env.SUPABASE_ANON_KEY) {
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  }
  
  console.log('✅ Test environment ready');
}