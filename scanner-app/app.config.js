const dotenv = require('dotenv');
dotenv.config();

module.exports = ({ config }) => ({
  expo: {
    name: 'SwagTix Scanner',
    slug: 'swagtix-scanner',
    scheme: 'swagtix',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      infoPlist: {
        NSCameraUsageDescription: 'This app uses the camera to scan QR codes on tickets.'
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      permissions: [
        'android.permission.CAMERA',
        'android.permission.VIBRATE'
      ]
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: { projectId: '00000000-0000-0000-0000-000000000000' },
      FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
      FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
      FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
      FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
      FIREBASE_REGION: process.env.FIREBASE_REGION || 'us-central1',
      SWAGTIX_PRIMARY_COLOR: process.env.EXPO_PUBLIC_SWAGTIX_PRIMARY_COLOR || '#2B6CB0',
      SWAGTIX_SECONDARY_COLOR: process.env.EXPO_PUBLIC_SWAGTIX_SECONDARY_COLOR || '#3182CE',
      SWAGTIX_SUCCESS_COLOR: process.env.EXPO_PUBLIC_SWAGTIX_SUCCESS_COLOR || '#22C55E',
      SWAGTIX_ERROR_COLOR: process.env.EXPO_PUBLIC_SWAGTIX_ERROR_COLOR || '#EF4444',
      SWAGTIX_WARNING_COLOR: process.env.EXPO_PUBLIC_SWAGTIX_WARNING_COLOR || '#F59E0B'
    }
  }
});
