/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
  starC: {
    primary: '#FFD700', // Gold
    secondary: '#FFA500', // Orange
    background: '#000000', // Black
    surface: '#1A1A1A', // Dark gray
    text: '#FFFFFF', // White
    textSecondary: '#CCCCCC', // Light gray
    border: '#333333', // Medium gray
    success: '#4CAF50', // Green
    successLight: '#4CAF5020', // Light green background
    error: '#F44336', // Red
    warning: '#FF9800', // Orange
  },
};
