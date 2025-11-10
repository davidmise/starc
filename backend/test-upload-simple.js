const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;

const testUploadSimple = async () => {
  console.log('🧪 Simple Upload Test...\n');

  try {
    // 1. Test authentication
    console.log('1. Testing Authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Authentication successful');
    } else {
      console.log('❌ Authentication failed');
      return;
    }

    // 2. Create a test session
    console.log('\n2. Creating Test Session...');
    const sessionData = {
      title: 'Upload Test Session',
      caption: 'Testing upload functionality',
      genre: 'Music',
      start_time: new Date(Date.now() + 3600000).toISOString()
    };

    const sessionResponse = await axios.post(`${BASE_URL}/sessions`, sessionData, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (sessionResponse.status === 201) {
      const sessionId = sessionResponse.data.session?.id;
      console.log('✅ Test session created, ID:', sessionId);

      // 3. Test poster upload
      console.log('\n3. Testing Poster Upload...');
      try {
        // Create a test image file
        const testImageContent = 'Test image content';
        const testImagePath = path.join(__dirname, 'test-poster.jpg');
        fs.writeFileSync(testImagePath, testImageContent);
        
        const form = new FormData();
        form.append('poster', fs.createReadStream(testImagePath));
        
        console.log('📤 Uploading file...');
        const uploadResponse = await axios.post(`${BASE_URL}/upload/session-poster/${sessionId}`, form, {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            ...form.getHeaders()
          }
        });
        
        if (uploadResponse.status === 200) {
          console.log('✅ Poster upload working');
          console.log('📁 Uploaded file:', uploadResponse.data.poster?.filename);
        } else {
          console.log('❌ Poster upload failed');
        }
        
        // Clean up test file
        fs.unlinkSync(testImagePath);
      } catch (error) {
        console.log('❌ Poster upload error:', error.response?.data?.error || error.message);
        console.log('❌ Error details:', error.response?.status, error.response?.statusText);
      }

    } else {
      console.log('❌ Session creation failed');
    }

    console.log('\n🎯 Simple Upload Test Complete!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testUploadSimple(); 