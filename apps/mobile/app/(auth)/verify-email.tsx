import { View, Text, StyleSheet } from 'react-native';

export default function VerifyEmailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Verify Email Screen</Text>
      <Text style={styles.subtext}>TODO: Implement email verification</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, fontWeight: 'bold' },
  subtext: { marginTop: 8, color: '#666' },
});
