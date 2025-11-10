# Troubleshooting Guide - Network Connectivity

## 🔍 **Issue: Network Error in React Native App**

The React Native app is showing "Network Error" when trying to connect to the backend.

## ✅ **Solutions to Try**

### 1. **Verify Backend is Running**
```bash
# Check if backend is running on port 5000
netstat -an | findstr :5000

# Should show:
# TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING
```

### 2. **Test Backend Directly**
```bash
# Test with curl
curl http://192.168.81.194:5000/api/sessions

# Should return JSON response
```

### 3. **Check IP Address**
The current API configuration uses: `http://192.168.81.194:5000/api`

If your IP is different, update `services/api.ts`:
```typescript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5000/api';
```

### 4. **Firewall Issues**
- Windows Firewall might be blocking port 5000
- Try temporarily disabling firewall for testing
- Or add exception for port 5000

### 5. **React Native Network Issues**

#### **For Physical Device:**
- Make sure device is on same WiFi network
- Try using your computer's IP address
- Check if device can ping the IP

#### **For Emulator:**
- Android emulator: Use `10.0.2.2` instead of localhost
- iOS simulator: Use `localhost` or your IP

### 6. **Alternative API URLs to Try**

Update `services/api.ts` with one of these:

```typescript
// Option 1: Use localhost (for iOS simulator)
const API_BASE_URL = 'http://localhost:5000/api';

// Option 2: Use your IP (for physical devices)
const API_BASE_URL = 'http://192.168.81.194:5000/api';

// Option 3: Use 10.0.2.2 (for Android emulator)
const API_BASE_URL = 'http://10.0.2.2:5000/api';

// Option 4: Use 127.0.0.1
const API_BASE_URL = 'http://127.0.0.1:5000/api';
```

### 7. **Backend CORS Configuration**

The backend is configured to allow:
- `http://localhost:3000`
- `http://192.168.81.194:3000`
- `exp://192.168.81.194:8081`

If using different ports, update `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://192.168.81.194:3000", 
    "exp://192.168.81.194:8081",
    "http://localhost:8081",
    "exp://localhost:8081"
  ],
  credentials: true
}));
```

### 8. **Test Connection Script**

Run this to test API connectivity:

```bash
node test-connection.js
```

### 9. **React Native Debugging**

Add this to your API service for debugging:

```typescript
// Add to services/api.ts
api.interceptors.request.use(
  async (config) => {
    console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📦 Request Data:', config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.message);
    console.error('🔗 URL:', error.config?.url);
    console.error('📊 Status:', error.response?.status);
    return Promise.reject(error);
  }
);
```

### 10. **Quick Fixes to Try**

1. **Restart Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Restart React Native:**
   ```bash
   npm start
   # Then press 'r' to reload
   ```

3. **Clear React Native Cache:**
   ```bash
   npx expo start --clear
   ```

4. **Check Network Interface:**
   ```bash
   ipconfig | findstr "IPv4"
   ```

## 🎯 **Most Likely Solutions**

### **For Physical Device:**
1. Use your computer's IP address in `services/api.ts`
2. Make sure device is on same WiFi
3. Check Windows Firewall

### **For Emulator:**
1. Use `10.0.2.2:5000` for Android
2. Use `localhost:5000` for iOS

### **For Development:**
1. Use `localhost:5000` if running on same machine
2. Check if backend is actually running
3. Verify port 5000 is not blocked

## 📱 **Testing Steps**

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Test API:**
   ```bash
   curl http://192.168.81.194:5000/api/sessions
   ```

3. **Start Frontend:**
   ```bash
   npm start
   ```

4. **Try Login:**
   - Open app
   - Try to register/login
   - Check console for network errors

## 🔧 **If Still Not Working**

1. **Use Different Port:**
   - Change backend to port 3001
   - Update API_BASE_URL accordingly

2. **Use ngrok for Testing:**
   ```bash
   npx ngrok http 5000
   # Use the ngrok URL in API_BASE_URL
   ```

3. **Check Network Logs:**
   - Open browser dev tools
   - Check Network tab for failed requests
   - Look for CORS errors

**The most common issue is using the wrong IP address or port. Try the different API URLs listed above!** 🚀 