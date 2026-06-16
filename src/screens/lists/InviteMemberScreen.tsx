import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { useThemeStore } from "../../store/themeStore";

type Props = NativeStackScreenProps<RootStackParamList, "InviteMember">;

export function InviteMemberScreen({ route }: Props) {
  const { listName, inviteCode } = route.params;
  const theme = useThemeStore((state) => state.theme);
  const colors = theme.colors;

  async function handleCopyCode() {
    await Clipboard.setStringAsync(inviteCode);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Invite code copied to the clipboard.");
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "700" }}>
        {listName}
      </Text>
      <Text style={{ color: colors.mutedText, marginTop: 8, lineHeight: 22 }}>
        Invite someone by sending them this code. They can sign in, open My
        Lists, tap Join list, and enter the code.
      </Text>

      <View
        style={{
          marginTop: 24,
          padding: 24,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ color: colors.mutedText, fontSize: 12 }}>
          INVITE CODE
        </Text>
        <Text
          selectable
          style={{
            color: colors.primaryAccent,
            marginTop: 12,
            fontSize: 30,
            fontWeight: "800",
            letterSpacing: 5,
          }}
        >
          {inviteCode}
        </Text>

        <Pressable
          style={{
            minHeight: 52,
            marginTop: 20,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            backgroundColor: colors.primary,
          }}
          accessibilityRole="button"
          onPress={handleCopyCode}
        >
          <Text style={{ color: colors.primaryText, fontWeight: "700" }}>
            Copy invite code
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          marginTop: 20,
          padding: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
          How it works
        </Text>
        <Text style={{ color: colors.mutedText, marginTop: 10, lineHeight: 22 }}>
          1. Copy the code and send it privately.
        </Text>
        <Text style={{ color: colors.mutedText, marginTop: 6, lineHeight: 22 }}>
          2. The other person logs in and enters it from My Lists.
        </Text>
        <Text style={{ color: colors.mutedText, marginTop: 6, lineHeight: 22 }}>
          3. Both of you will see item changes instantly.
        </Text>
      </View>
    </ScrollView>
  );
}
