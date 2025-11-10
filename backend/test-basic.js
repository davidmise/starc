const axios = require('axios');

const testBasic = async () => {
  try {
    console.log('Testing basic endpoints...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health endpoint works');
    
    // Test a very simple database query
    const response = await axios.get('http://localhost:5000/api/sessions?limit=1');
    console.log('✅ Sessions endpoint works');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
  }
};

testBasic(); 