import { View, Image, StyleSheet, ActivityIndicator, Text } from 'react-native';

// Use relative path for reliability in production builds
const splashIcon = require('../assets/splash-icon.png');

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={splashIcon}
        style={styles.logo}
        resizeMode="contain"
        onError={(e) => console.warn('Splash image error:', e.nativeEvent.error)}
      />
      <Text style={styles.appName}>Mobilizer</Text>
      <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 16,
  },
  loader: {
    marginTop: 24,
  },
});
