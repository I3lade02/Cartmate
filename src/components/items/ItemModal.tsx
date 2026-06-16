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
import type { ShoppingItem, ShoppingItemInput } from "../../types/shopping";

type Props = {
  visible: boolean;
  item: ShoppingItem | null;
  loading: boolean;
  onClose: () => void;
  onSave: (input: ShoppingItemInput) => Promise<void>;
};

export function ItemModal({
  visible,
  item,
  loading,
  onClose,
  onSave,
}: Props) {
  const theme = useThemeStore((state) => state.theme);
  const colors = theme.colors;
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (visible) {
      setName(item?.name ?? "");
      setQuantity(item?.quantity ?? "");
    }
  }, [item, visible]);

  async function handleSave() {
    if (!name.trim() || loading) {
      return;
    }

    await onSave({ name, quantity });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: colors.overlay,
        }}
      >
        <View
          style={{
            padding: 24,
            paddingBottom: 32,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>
            {item ? "Edit item" : "Add item"}
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
            value={name}
            onChangeText={setName}
            placeholder="Item name"
            placeholderTextColor={colors.subtleText}
            cursorColor={colors.primaryAccent}
            selectionColor={colors.primaryAccent}
            autoCapitalize="sentences"
            returnKeyType="next"
            editable={!loading}
            autoFocus
          />

          <TextInput
            style={{
              minHeight: 54,
              marginTop: 12,
              paddingHorizontal: 16,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              borderRadius: 16,
              backgroundColor: colors.input,
            }}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Quantity, e.g. 2 bags"
            placeholderTextColor={colors.subtleText}
            cursorColor={colors.primaryAccent}
            selectionColor={colors.primaryAccent}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            editable={!loading}
          />

          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <Pressable
              style={{
                flex: 1,
                minHeight: 52,
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
                minHeight: 52,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                backgroundColor:
                  !name.trim() || loading
                    ? colors.primaryPressed
                    : colors.primary,
              }}
              disabled={!name.trim() || loading}
              onPress={handleSave}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={{ color: colors.primaryText, fontWeight: "700" }}>
                  Save item
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
