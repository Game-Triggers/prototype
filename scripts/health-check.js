/**
 * Quick Health Check
 * Run this to verify all services are running
 */

async function quickHealthCheck() {
    console.log('🏥 Quick Health Check...');
    
    const checks = [
        { name: 'Frontend', url: 'http://localhost:3000', expected: 'html' },
        { name: 'Backend', url: 'http://localhost:3001/api/v1', expected: 'json' },
        { name: 'Auth API', url: 'http://localhost:3000/api/auth/session', expected: 'json' },
        { name: 'Admin API', url: 'http://localhost:3000/api/admin/conflict-rules', expected: 'auth_required' }
    ];
    
    for (const check of checks) {
        try {
            const response = await fetch(check.url);
            const status = response.status;
            
            if (check.expected === 'html' && status === 200) {
                console.log(`✅ ${check.name}: Running (${status})`);
            } else if (check.expected === 'json' && status === 200) {
                console.log(`✅ ${check.name}: Running (${status})`);
            } else if (check.expected === 'auth_required' && status === 401) {
                console.log(`✅ ${check.name}: Protected (${status})`);
            } else {
                console.log(`⚠️  ${check.name}: Unexpected status (${status})`);
            }
        } catch (error) {
            console.log(`❌ ${check.name}: Error - ${error.message}`);
        }
    }
    
    console.log('\n📖 Next Steps:');
    console.log('1. Log in at: http://localhost:3000/auth/signin');
    console.log('2. Visit: http://localhost:3000/dashboard/admin/conflict-rules');
    console.log('3. Copy step-by-step-test.js content to browser console');
    console.log('4. Run: runFullTest()');
}

quickHealthCheck().catch(console.error);
