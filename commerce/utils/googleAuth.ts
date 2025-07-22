// utils/googleAuth.ts
import * as Google from 'expo-auth-session/providers/google';

export const useGoogleLogin = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "TON_ANDROID_CLIENT_ID",
    iosClientId: "TON_IOS_CLIENT_ID",
  });

  return { request, response, promptAsync };
};
