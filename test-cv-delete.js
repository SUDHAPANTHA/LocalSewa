// Test CV deletion and smart score reset
const axios = require('axios');

const API_URL = 'http://localhost:5000';
const PROVIDER_ID = 'YOUR_PROVIDER_ID'; // Replace with actual provider ID

async function testCvDeletion() {
  try {
    console.log('Testing CV deletion...');
    
    // Delete CV
    const deleteResponse = await axios.delete(`${API_URL}/provider/${PROVIDER_ID}/cv`);
    console.log('Delete Response:', deleteResponse.data);
    console.log('Smart Score after deletion:', deleteResponse.data.provider.smartScore);
    
    // Verify by fetching provider profile
    const profileResponse = await axios.get(`${API_URL}/provider/${PROVIDER_ID}`);
    console.log('\nProvider Profile:');
    console.log('Smart Score:', profileResponse.data.provider.smartScore);
    console.log('CV Status:', profileResponse.data.provider.cvStatus);
    console.log('CV Score:', profileResponse.data.provider.cvScore);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testCvDeletion();
