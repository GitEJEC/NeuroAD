import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';

// Short confirmation buzz. Expo Go 58 for Android ships without the ExpoHaptics native module,
// so fall back to React Native's Vibration instead of leaving an unhandled rejection.
export function vibrate() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => Vibration.vibrate(40));
}
