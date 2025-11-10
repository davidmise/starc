# 🔧 Network Connectivity Troubleshooting Guide

## 🚨 **Current Issue: Network Errors in React Native App**

The React Native app is experiencing network connectivity issues when trying to connect to the backend. Here's what we know:

### ✅ **Backend Status: WORKING**
- Backend server is running on port 5000
- Health endpoint responding: `{"status":"OK","message":"Stars Corporate API is running"}`
- Sessions endpoint working: 10 sessions available
- Accessible via: `http://localhost:5000/api`

### ❌ **React Native App Issues:**
- Network errors when trying to connect
- "Response Data: undefined" errors
- Multiple failed connection attempts

## 🔍 **Root Cause Analysis**

### **1. URL Testing Issues**
The app is testing these URLs in order:
1. `http://10.0.2.2:5000/api` (Android emulator) - ❌ Timeout
2. `http://localhost:5000/api` (iOS simulator) - ❌ Failed
3. `http://192.168.81.194:5000/api` (Physical device) - ❌ Network Error

### **2. Platform-Specific Issues**
- **Android Emulator**: `10.0.2.2` should work but timing out
- **iOS Simulator**: `localhost` should work but failing
- **Physical Device**: `192.168.81.194` should work but network error

## 🛠️ **Solutions**

### **Solution 1: Force Localhost URL**
Update the API service to prioritize localhost:

```typescript
// In services/api.ts
const API_URLS = {
  android: 'http://localhost:5000/api',      // Changed from 10.0.2.2
  ios: 'http://localhost:5000/api',          // Already correct
  web: 'http://localhost:5000/api',          // Changed from 192.168.81.194
  fallback: 'http://localhost:5000/api'      // Changed from 192.168.81.194
};
```

### **Solution 2: Increase Timeout**
The 3-second timeout might be too short. Increase it:

```typescript
// In services/api.ts
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased from 10000
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### **Solution 3: Disable SSL Verification (Development Only)**
For development, you can disable SSL verification:

```typescript
// In services/api.ts
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add this for development only
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});
```

### **Solution 4: Use IP Address**
Find your computer's IP address and use it:

```bash
# On Windows
ipconfig

# Look for IPv4 Address under your network adapter
# Example: 192.168.1.100
```

Then update the URLs:
```typescript
const API_URLS = {
  android: 'http://YOUR_IP:5000/api',
  ios: 'http://YOUR_IP:5000/api',
  web: 'http://YOUR_IP:5000/api',
  fallback: 'http://YOUR_IP:5000/api'
};
```

## 🚀 **Quick Fix**

The fastest solution is to update the API URLs to use localhost:

```typescript
// Update services/api.ts
const API_URLS = {
  android: 'http://localhost:5000/api',
  ios: 'http://localhost:5000/api',
  web: 'http://localhost:5000/api',
  fallback: 'http://localhost:5000/api'
};
```

## 🔍 **Testing Steps**

1. **Update the URLs** as shown above
2. **Restart the React Native app**
3. **Check the logs** for successful connections
4. **Test authentication** by trying to login/register

## 📱 **Platform-Specific Notes**

### **Android Emulator**
- Should use `10.0.2.2` to access host machine
- If that fails, try `localhost` or your computer's IP

### **iOS Simulator**
- Should use `localhost` to access host machine
- Usually works without issues

### **Physical Device**
- Must use your computer's IP address
- Both devices must be on same network
- Firewall might block connections

## 🎯 **Expected Result**

After applying the fix, you should see:
```
✅ Found working API URL: http://localhost:5000/api
✅ API connected successfully
```

And the network errors should disappear from the console. 