// Manual test for AsyncStorage functionality
import AsyncStorage from '@react-native-async-storage/async-storage';

export const testTokenStorage = async () => {
  try {
    console.log('🧪 Testing AsyncStorage functionality...');
    
    // Test 1: Basic storage and retrieval
    const testToken = 'test-token-12345';
    console.log('📝 Storing test token:', testToken);
    
    await AsyncStorage.setItem('testToken', testToken);
    console.log('✅ Test token stored');
    
    const retrieved = await AsyncStorage.getItem('testToken');
    console.log('🔍 Retrieved token:', retrieved);
    
    if (retrieved === testToken) {
      console.log('✅ Basic AsyncStorage test PASSED');
    } else {
      console.error('❌ Basic AsyncStorage test FAILED');
      return false;
    }
    
    // Test 2: Clear and verify
    await AsyncStorage.removeItem('testToken');
    const afterClear = await AsyncStorage.getItem('testToken');
    
    if (afterClear === null) {
      console.log('✅ AsyncStorage clear test PASSED');
    } else {
      console.error('❌ AsyncStorage clear test FAILED');
      return false;
    }
    
    // Test 3: Persistence test (check if userToken exists)
    const existingUserToken = await AsyncStorage.getItem('userToken');
    console.log('🔍 Existing userToken:', existingUserToken ? `Found (${existingUserToken.length} chars)` : 'Not found');
    
    console.log('✅ All AsyncStorage tests completed');
    return true;
    
  } catch (error) {
    console.error('❌ AsyncStorage test failed:', error);
    return false;
  }
};