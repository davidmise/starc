const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;

const testFileUpload = async () => {
  console.log('🧪 Testing File Upload System...\n');

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

    // 2. Create a test session first
    console.log('\n2. Creating Test Session...');
    const sessionData = {
      title: 'File Upload Test Session',
      caption: 'Testing file upload functionality',
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
        // Create a test JPEG image file (proper format)
        const testImageContent = Buffer.from([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
          0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
          0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
          0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
          0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
          0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
          0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
          0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
          0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
          0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
          0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
          0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
          0x00, 0xFF, 0xD9
        ]);
        const testImagePath = path.join(__dirname, 'test-poster.jpg');
        fs.writeFileSync(testImagePath, testImageContent);
        
        const form = new FormData();
        form.append('poster', fs.createReadStream(testImagePath), {
          filename: 'test-poster.jpg',
          contentType: 'image/jpeg'
        });
        
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
      }

      // 4. Test video upload
      console.log('\n4. Testing Video Upload...');
      try {
        // Create a test MP4 video file (proper format)
        const testVideoContent = Buffer.from([
          0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
          0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
          0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08,
          0x66, 0x72, 0x65, 0x65, 0x00, 0x00, 0x00, 0x00
        ]);
        const testVideoPath = path.join(__dirname, 'test-video.mp4');
        fs.writeFileSync(testVideoPath, testVideoContent);
        
        const form = new FormData();
        form.append('video', fs.createReadStream(testVideoPath), {
          filename: 'test-video.mp4',
          contentType: 'video/mp4'
        });
        
        const uploadResponse = await axios.post(`${BASE_URL}/upload/session-video/${sessionId}`, form, {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            ...form.getHeaders()
          }
        });
        
        if (uploadResponse.status === 200) {
          console.log('✅ Video upload working');
          console.log('📁 Uploaded file:', uploadResponse.data.video?.filename);
        } else {
          console.log('❌ Video upload failed');
        }
        
        // Clean up test file
        fs.unlinkSync(testVideoPath);
      } catch (error) {
        console.log('❌ Video upload error:', error.response?.data?.error || error.message);
      }

      // 5. Test avatar upload
      console.log('\n5. Testing Avatar Upload...');
      try {
        // Create a test JPEG avatar file (proper format)
        const testAvatarContent = Buffer.from([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
          0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
          0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
          0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
          0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
          0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
          0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
          0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
          0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
          0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
          0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
          0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
          0x00, 0xFF, 0xD9
        ]);
        const testAvatarPath = path.join(__dirname, 'test-avatar.jpg');
        fs.writeFileSync(testAvatarPath, testAvatarContent);
        
        const form = new FormData();
        form.append('avatar', fs.createReadStream(testAvatarPath), {
          filename: 'test-avatar.jpg',
          contentType: 'image/jpeg'
        });
        
        const uploadResponse = await axios.post(`${BASE_URL}/upload/avatar`, form, {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            ...form.getHeaders()
          }
        });
        
        if (uploadResponse.status === 200) {
          console.log('✅ Avatar upload working');
          console.log('📁 Uploaded file:', uploadResponse.data.avatar?.filename);
        } else {
          console.log('❌ Avatar upload failed');
        }
        
        // Clean up test file
        fs.unlinkSync(testAvatarPath);
      } catch (error) {
        console.log('❌ Avatar upload error:', error.response?.data?.error || error.message);
      }

      // 6. Test file info endpoint
      console.log('\n6. Testing File Info Endpoint...');
      try {
        // Create a test file first
        const testFilePath = path.join(__dirname, 'test-file.txt');
        fs.writeFileSync(testFilePath, 'Test file content');
        
        const fileInfoResponse = await axios.get(`${BASE_URL}/upload/file-info/test-file.txt`);
        
        if (fileInfoResponse.status === 200) {
          console.log('✅ File info endpoint working');
        } else {
          console.log('❌ File info endpoint failed');
        }
        
        // Clean up test file
        fs.unlinkSync(testFilePath);
      } catch (error) {
        console.log('❌ File info error:', error.response?.data?.error || error.message);
      }

      // 7. Test media deletion
      console.log('\n7. Testing Media Deletion...');
      try {
        const deleteResponse = await axios.delete(`${BASE_URL}/upload/session-media/${sessionId}/poster`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (deleteResponse.status === 200) {
          console.log('✅ Media deletion working');
        } else {
          console.log('❌ Media deletion failed');
        }
      } catch (error) {
        console.log('❌ Media deletion error:', error.response?.data?.error || error.message);
      }

    } else {
      console.log('❌ Session creation failed');
    }

    console.log('\n🎯 File Upload Testing Complete!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testFileUpload(); 