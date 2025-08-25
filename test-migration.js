// Simple test to validate migration script execution
console.log('Testing migration script import...');

// Test the module import
import('./scripts/migrate-user-roles.ts')
  .then(() => {
    console.log('✅ Migration script imports successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script import failed:', error.message);
    process.exit(1);
  });
