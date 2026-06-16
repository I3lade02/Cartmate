import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { loginUser } from "../../services/authServices";
import { useThemeStore } from "../../store/themeStore";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const theme = useThemeStore((state) => state.theme);
  const colors = theme.colors;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      await Haptics.selectionAsync();

      if (!email.trim() || !password.trim()) {
        Alert.alert("Missing info", "Please enter email and password.");
        return;
      }

      await loginUser(email.trim(), password);
    } catch (error) {
      console.log(error);
      Alert.alert("Login failed", "Check your email and password.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: colors.text, fontSize: 36, fontWeight: "700" }}>
            CartMate
          </Text>
          <Text style={{ color: colors.mutedText, marginTop: 8, lineHeight: 21 }}>
            Shared shopping lists for people who keep forgetting milk.
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <TextInput
            style={{
              minHeight: 56,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              backgroundColor: colors.surface,
            }}
            placeholder="Email"
            placeholderTextColor={colors.subtleText}
            cursorColor={colors.primaryAccent}
            selectionColor={colors.primaryAccent}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />

          <TextInput
            style={{
              minHeight: 56,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              backgroundColor: colors.surface,
            }}
            placeholder="Password"
            placeholderTextColor={colors.subtleText}
            cursorColor={colors.primaryAccent}
            selectionColor={colors.primaryAccent}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Pressable
            style={{
              minHeight: 56,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 16,
              backgroundColor: colors.primary,
            }}
            accessibilityRole="button"
            onPress={handleLogin}
          >
            <Text
              style={{
                color: colors.primaryText,
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Log in
            </Text>
          </Pressable>

          <Pressable
            style={{
              minHeight: 52,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
            accessibilityRole="button"
            accessibilityLabel="Create a new account"
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={{ color: colors.mutedText }}>
              Don&apos;t have an account yet?{" "}
              <Text style={{ color: colors.primaryAccent, fontWeight: "700" }}>
                Create account
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
