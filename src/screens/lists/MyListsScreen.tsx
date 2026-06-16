import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ListActionModal } from "../../components/lists/ListActionModal";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  createShoppingList,
  deleteShoppingList,
  joinListByInviteCode,
  leaveShoppingList,
  listenToUsersLists,
} from "../../services/listServices";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import type { FirestoreSyncState, ShoppingList } from "../../types/shopping";

type Props = NativeStackScreenProps<RootStackParamList, "MyLists">;
type ModalMode = "create" | "join" | null;

function getListActionErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message.toLowerCase().includes("permission")
  ) {
    return "Firebase rejected this action. Deploy the latest Firestore rules, then try again.";
  }

  return "Could not update this list.";
}

export function MyListsScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const colors = theme.colors;
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [syncState, setSyncState] = useState<FirestoreSyncState>({
    fromCache: false,
    hasPendingWrites: false,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={{ color: colors.primaryAccent, fontWeight: "700" }}>
            Settings
          </Text>
        </Pressable>
      ),
    });
  }, [colors.primaryAccent, navigation]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    return listenToUsersLists(
      user.uid,
      (nextLists, nextSyncState) => {
        setLists(nextLists);
        setSyncState(nextSyncState);
        setIsLoading(false);
      },
      (error) => {
        console.log(error);
        setIsLoading(false);
        Alert.alert("Lists unavailable", "Could not load your shopping lists.");
      }
    );
  }, [user]);

  async function handleModalSubmit(value: string) {
    if (!user || !modalMode) {
      return;
    }

    try {
      setIsSaving(true);

      if (modalMode === "create") {
        await createShoppingList(value, user.uid);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        await joinListByInviteCode(value, user.uid);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }

      setModalMode(null);
    } catch (error) {
      console.log(error);
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      Alert.alert(
        modalMode === "create" ? "Could not create list" : "Could not join list",
        message
      );
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(list: ShoppingList) {
    Alert.alert(
      "Delete shopping list?",
      `"${list.name}" and all of its items will be permanently deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
              await deleteShoppingList(list);
            } catch (error) {
              console.log(error);
              Alert.alert("Delete failed", getListActionErrorMessage(error));
            }
          },
        },
      ]
    );
  }

  function confirmLeave(list: ShoppingList) {
    if (!user) {
      return;
    }

    Alert.alert(
      "Leave shopping list?",
      `"${list.name}" will be removed from your lists. Other members can keep using it.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );
              await leaveShoppingList(list, user.uid);
            } catch (error) {
              console.log(error);
              Alert.alert("Leave failed", getListActionErrorMessage(error));
            }
          },
        },
      ]
    );
  }

  function renderListCard({ item }: { item: ShoppingList }) {
    const card = (
      <Pressable
        style={{
          padding: 20,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
        accessibilityRole="button"
        onPress={() =>
          navigation.navigate("ShoppingListDetail", {
            listId: item.id,
            listName: item.name,
          })
        }
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={2}
              style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}
            >
              {item.name}
            </Text>
            <Text style={{ color: colors.mutedText, marginTop: 7 }}>
              {item.memberIds.length}{" "}
              {item.memberIds.length === 1 ? "member" : "members"}
            </Text>
          </View>

          {item.ownerId === user?.uid && (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: colors.successSurface,
              }}
            >
              <Text
                style={{
                  color: colors.successText,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                OWNER
              </Text>
            </View>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 18,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: colors.surfaceMuted,
          }}
        >
          <Text style={{ color: colors.subtleText, fontSize: 12 }}>
            INVITE CODE
          </Text>
          <Text
            style={{
              color: colors.primaryAccent,
              fontSize: 16,
              fontWeight: "700",
              letterSpacing: 2,
            }}
          >
            {item.inviteCode}
          </Text>
        </View>

        <Pressable
          style={{
            minHeight: 42,
            marginTop: 14,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.dangerBorder,
            backgroundColor: colors.dangerSurface,
          }}
          accessibilityRole="button"
          onPress={(event) => {
            event.stopPropagation();
            if (item.ownerId === user?.uid) {
              confirmDelete(item);
            } else {
              confirmLeave(item);
            }
          }}
        >
          <Text style={{ color: colors.dangerText, fontWeight: "700" }}>
            {item.ownerId === user?.uid ? "Delete list" : "Leave list"}
          </Text>
        </Pressable>
      </Pressable>
    );

    if (item.ownerId !== user?.uid) {
      return <View style={{ marginBottom: 14 }}>{card}</View>;
    }

    return (
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        containerStyle={{ marginBottom: 14, borderRadius: 22 }}
        renderRightActions={(_, __, methods) => (
          <Pressable
            style={{
              width: 92,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.danger,
            }}
            onPress={() => {
              methods.close();
              confirmDelete(item);
            }}
          >
            <Text style={{ color: colors.dangerButtonText, fontWeight: "700" }}>
              Delete
            </Text>
          </Pressable>
        )}
      >
        {card}
      </ReanimatedSwipeable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={renderListCard}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 40,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: "700" }}>
              My Lists
            </Text>
            <Text style={{ color: colors.mutedText, marginTop: 7 }}>
              Shared lists update instantly for every member.
            </Text>

            {(syncState.fromCache || syncState.hasPendingWrites) && (
              <View
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.warningBorder,
                  backgroundColor: colors.warningSurface,
                }}
              >
                <Text style={{ color: colors.warningText, lineHeight: 20 }}>
                  {syncState.hasPendingWrites
                    ? "Some changes are saved locally and waiting to sync."
                    : "Offline mode: showing saved lists from this device."}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 12, marginTop: 22 }}>
              <Pressable
                style={{
                  flex: 1,
                  minHeight: 54,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                }}
                accessibilityRole="button"
                onPress={() => setModalMode("create")}
              >
                <Text style={{ color: colors.primaryText, fontWeight: "700" }}>
                  + New list
                </Text>
              </Pressable>

              <Pressable
                style={{
                  flex: 1,
                  minHeight: 54,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surface,
                }}
                accessibilityRole="button"
                onPress={() => setModalMode("join")}
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>
                  Join by code
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ flex: 1, alignItems: "center", paddingTop: 60 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.mutedText, marginTop: 14 }}>
                Loading your lists...
              </Text>
            </View>
          ) : (
            <View
              style={{
                alignItems: "center",
                marginTop: 40,
                padding: 28,
                borderRadius: 24,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>
                No shopping lists yet
              </Text>
              <Text
                style={{
                  color: colors.mutedText,
                  marginTop: 10,
                  lineHeight: 22,
                  textAlign: "center",
                }}
              >
                Create your first list or join one with an invite code.
              </Text>
            </View>
          )
        }
      />

      <ListActionModal
        mode={modalMode ?? "create"}
        visible={modalMode !== null}
        loading={isSaving}
        onClose={() => {
          if (!isSaving) {
            setModalMode(null);
          }
        }}
        onSubmit={handleModalSubmit}
      />
    </View>
  );
}
