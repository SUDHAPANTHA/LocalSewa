// Quick test script to check if admin services API works
// Run with: node test-admin-services-api.js

const http = require('http');

const PORT = process.env.PORT || 5000;
const HOST = 'localhost';

console.log(`Testing admin services API at http://${HOST}:${PORT}/admin/services`);

const options = {
  hostname: HOST,
  port: PORT,
  path: '/admin/services',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  console.log(`\nStatus Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n=== Response Body ===');
    try {
      const parsed = JSON.parse(data);
      console.log('Services count:', parsed.services?.length || 0);
      console.log('\nFull response:');
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.services && parsed.services.length > 0) {
        console.log('\n✅ SUCCESS: Services found!');
        console.log('\nFirst service:');
        console.log(JSON.stringify(parsed.services[0], null, 2));
      } else {
        console.log('\n⚠️  WARNING: No services in database');
        console.log('Create a service as vendor first');
      }
    } catch (e) {
      console.log('Raw response:', data);
      console.log('\n❌ ERROR: Invalid JSON response');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ ERROR: Failed to connect to backend');
  console.error('Error:', error.message);
  console.error('\nMake sure backend is running:');
  console.error('  cd backend');
  console.error('  npm start');
});

req.end();
