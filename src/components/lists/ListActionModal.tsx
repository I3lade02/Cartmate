import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useThemeStore } from "../../store/themeStore";

type ListActionMode = "create" | "join";

type Props = {
  mode: ListActionMode;
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (value: string) => Promise<void>;
};

export function ListActionModal({
  mode,
  visible,
  loading,
  onClose,
  onSubmit,
}: Props) {
  const theme = useThemeStore((state) => state.theme);
  const colors = theme.colors;
  const [value, setValue] = useState("");
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (visible) {
      setValue("");
    }
  }, [mode, visible]);

  async function handleSubmit() {
    if (!value.trim() || loading) {
      return;
    }

    await onSubmit(value);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
          backgroundColor: colors.overlay,
        }}
      >
        <View
          style={{
            padding: 24,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>
            {isCreateMode ? "Create a list" : "Join a list"}
          </Text>
          <Text style={{ color: colors.mutedText, marginTop: 8, lineHeight: 21 }}>
            {isCreateMode
              ? "Give your shared shopping list a clear name."
              : "Enter the 8-character invite code shared by a list member."}
          </Text>

          <TextInput
            style={{
              minHeight: 54,
              marginTop: 20,
              paddingHorizontal: 16,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              borderRadius: 16,
              backgroundColor: colors.input,
            }}
            value={value}
            onChangeText={(nextValue) =>
              setValue(isCreateMode ? nextValue : nextValue.toUpperCase())
            }
            placeholder={isCreateMode ? "Weekly groceries" : "ABCD2345"}
            placeholderTextColor={colors.subtleText}
            cursorColor={colors.primaryAccent}
            selectionColor={colors.primaryAccent}
            autoCapitalize={isCreateMode ? "sentences" : "characters"}
            autoCorrect={isCreateMode}
            maxLength={isCreateMode ? 80 : 8}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            editable={!loading}
            autoFocus
          />

          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <Pressable
              style={{
                flex: 1,
                minHeight: 50,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.borderStrong,
              }}
              disabled={loading}
              onPress={onClose}
            >
              <Text style={{ color: colors.mutedText, fontWeight: "600" }}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={{
                flex: 1,
                minHeight: 50,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                backgroundColor:
                  !value.trim() || loading
                    ? colors.primaryPressed
                    : colors.primary,
              }}
              disabled={!value.trim() || loading}
              onPress={handleSubmit}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={{ color: colors.primaryText, fontWeight: "700" }}>
                  {isCreateMode ? "Create" : "Join"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
