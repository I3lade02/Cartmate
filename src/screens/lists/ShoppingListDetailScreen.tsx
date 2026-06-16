import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Pressable,
  SectionList,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ItemModal } from "../../components/items/ItemModal";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  addItemToList,
  deleteItemFromList,
  listenToListItems,
  toggleItemChecked,
  updateItemInList,
} from "../../services/itemServices";
import {
  deleteShoppingList,
  leaveShoppingList,
  listenToShoppingList,
} from "../../services/listServices";
import { scheduleItemsAddedNotification } from "../../services/notificationServices";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import type {
  FirestoreSyncState,
  ShoppingItem,
  ShoppingItemInput,
  ShoppingList,
} from "../../types/shopping";
import type { Unsubscribe } from "firebase/firestore";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "ShoppingListDetail"
>;

type ItemSection = {
  title: string;
  description: string;
  type: "active" | "bought";
  data: ShoppingItem[];
};

function getListActionErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message.toLowerCase().includes("permission")
  ) {
    return "Firebase rejected this action. Deploy the latest Firestore rules, then try again.";
  }

  return "Could not update this list.";
}

export function ShoppingListDetailScreen({ navigation, route }: Props) {
  const { listId, listName } = route.params;
  const user = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const colors = theme.colors;
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<FirestoreSyncState>({
    fromCache: false,
    hasPendingWrites: false,
  });
  const didLoadInitialItemsRef = useRef(false);
  const isDeletingListRef = useRef(false);
  const itemListenerRef = useRef<Unsubscribe | null>(null);
  const listListenerRef = useRef<Unsubscribe | null>(null);
  const pendingRemoteAddCountRef = useRef(0);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    didLoadInitialItemsRef.current = false;

    itemListenerRef.current?.();
    const unsubscribe = listenToListItems(
      listId,
      (nextItems, nextSyncState, addedItems) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setItems(nextItems);
        setSyncState(nextSyncState);
        setIsLoading(false);

        if (didLoadInitialItemsRef.current) {
          queueRemoteAddNotification(addedItems);
        }

        didLoadInitialItemsRef.current = true;
      },
      (error) => {
        if (isDeletingListRef.current) {
          return;
        }

        console.log(error);
        setIsLoading(false);
        Alert.alert("Items unavailable", "Could not load this shopping list.");
      }
    );

    itemListenerRef.current = unsubscribe;

    return () => {
      unsubscribe();
      if (itemListenerRef.current === unsubscribe) {
        itemListenerRef.current = null;
      }
    };
  }, [listId]);

  useEffect(() => {
    listListenerRef.current?.();
    const unsubscribe = listenToShoppingList(
      listId,
      (list, nextSyncState) => {
        setCurrentList(list);
        setInviteCode(list?.inviteCode ?? "");

        if (!list && !nextSyncState.fromCache) {
          navigation.navigate("MyLists");
        }
      },
      (error) => console.log(error)
    );

    listListenerRef.current = unsubscribe;

    return () => {
      unsubscribe();
      if (listListenerRef.current === unsubscribe) {
        listListenerRef.current = null;
      }
    };
  }, [listId, navigation]);

  const checkedCount = items.filter((item) => item.checked).length;
  const canDeleteList = currentList?.ownerId === user?.uid;
  const canLeaveList = !!currentList && currentList.ownerId !== user?.uid;
  const listActionLabel = canDeleteList ? "Delete" : "Leave";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: listName,
      headerRight: canDeleteList || canLeaveList
        ? () => (
            <Pressable
              accessibilityRole="button"
              onPress={canDeleteList ? confirmDeleteList : confirmLeaveList}
            >
              <Text style={{ color: colors.dangerText, fontWeight: "700" }}>
                {listActionLabel}
              </Text>
            </Pressable>
          )
        : undefined,
    });
  }, [
    canDeleteList,
    canLeaveList,
    colors.dangerText,
    listActionLabel,
    listName,
    navigation,
  ]);

  function queueRemoteAddNotification(addedItems: ShoppingItem[]) {
    if (!user) {
      return;
    }

    const remoteAddedItems = addedItems.filter(
      (item) => item.createdBy !== user.uid
    );

    if (remoteAddedItems.length === 0) {
      return;
    }

    pendingRemoteAddCountRef.current += remoteAddedItems.length;

    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }

    notificationTimerRef.current = setTimeout(() => {
      const count = pendingRemoteAddCountRef.current;
      pendingRemoteAddCountRef.current = 0;

      scheduleItemsAddedNotification({
        listId,
        listName,
        count,
      }).catch((error) => {
        console.log(error);
      });
    }, 1600);
  }

  function showWriteStatus(status: "synced" | "queued") {
    if (status === "queued") {
      setOfflineNotice("Saved locally. It will sync when you reconnect.");
    } else {
      setOfflineNotice(null);
    }
  }

  function openAddModal() {
    setEditingItem(null);
    setIsModalVisible(true);
  }

  function openEditModal(item: ShoppingItem) {
    setEditingItem(item);
    setIsModalVisible(true);
  }

  async function handleSaveItem(input: ShoppingItemInput) {
    if (!user) {
      return;
    }

    try {
      setIsSaving(true);

      if (editingItem) {
        const status = await updateItemInList(listId, editingItem.id, input);
        showWriteStatus(status);
      } else {
        const status = await addItemToList(listId, input, user.uid);
        showWriteStatus(status);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsModalVisible(false);
      setEditingItem(null);
    } catch (error) {
      console.log(error);
      const message =
        error instanceof Error ? error.message : "Could not save this item.";
      Alert.alert("Save failed", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleItem(item: ShoppingItem) {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const status = await toggleItemChecked(listId, item.id, !item.checked);
      showWriteStatus(status);
    } catch (error) {
      console.log(error);
      Alert.alert("Update failed", "Could not update this item.");
    }
  }

  function confirmDeleteItem(item: ShoppingItem) {
    Alert.alert("Delete item?", item.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            );
            const status = await deleteItemFromList(listId, item.id);
            showWriteStatus(status);
          } catch (error) {
            console.log(error);
            Alert.alert("Delete failed", "Could not delete this item.");
          }
        },
      },
    ]);
  }

  function confirmDeleteList() {
    if (!currentList) {
      return;
    }

    Alert.alert(
      "Delete shopping list?",
      `"${currentList.name}" and all of its items will be permanently deleted.`,
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
              isDeletingListRef.current = true;
              itemListenerRef.current?.();
              listListenerRef.current?.();
              await deleteShoppingList(currentList);
              navigation.navigate("MyLists");
            } catch (error) {
              isDeletingListRef.current = false;
              console.log(error);
              Alert.alert("Delete failed", getListActionErrorMessage(error));
            }
          },
        },
      ]
    );
  }

  function confirmLeaveList() {
    if (!currentList || !user) {
      return;
    }

    Alert.alert(
      "Leave shopping list?",
      `"${currentList.name}" will be removed from your lists. Other members can keep using it.`,
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
              isDeletingListRef.current = true;
              itemListenerRef.current?.();
              listListenerRef.current?.();
              await leaveShoppingList(currentList, user.uid);
              navigation.navigate("MyLists");
            } catch (error) {
              isDeletingListRef.current = false;
              console.log(error);
              Alert.alert("Leave failed", getListActionErrorMessage(error));
            }
          },
        },
      ]
    );
  }

  function renderSectionHeader({ section }: { section: ItemSection }) {
    return (
      <View
        style={{
          marginTop: section.type === "active" ? 0 : 22,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
          {section.title}
        </Text>
        <Text style={{ color: colors.subtleText, marginTop: 3 }}>
          {section.description}
        </Text>
      </View>
    );
  }

  function renderItem({
    item,
    section,
  }: {
    item: ShoppingItem;
    section: ItemSection;
  }) {
    const isBoughtSection = section.type === "bought";

    return (
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        containerStyle={{ marginBottom: 12, borderRadius: 18 }}
        renderRightActions={(_, __, methods) => (
          <Pressable
            style={{
              width: 96,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.danger,
            }}
            onPress={() => {
              methods.close();
              confirmDeleteItem(item);
            }}
          >
            <Text style={{ color: colors.dangerButtonText, fontWeight: "700" }}>
              Delete
            </Text>
          </Pressable>
        )}
      >
        <View
          style={{
            padding: 16,
            borderWidth: 1,
            borderColor: item.checked ? colors.successBorder : colors.border,
            borderRadius: 18,
            backgroundColor: item.checked
              ? colors.successSurface
              : colors.surface,
            opacity: item.checked ? 0.72 : 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Pressable
              style={{
                width: 30,
                height: 30,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                borderWidth: 2,
                borderColor: item.checked
                  ? colors.primary
                  : colors.subtleText,
                backgroundColor: item.checked ? colors.primary : "transparent",
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.checked }}
              onPress={() => handleToggleItem(item)}
            >
              {item.checked && (
                <Text
                  style={{
                    color: colors.primaryText,
                    fontSize: 18,
                    fontWeight: "900",
                  }}
                >
                  X
                </Text>
              )}
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: item.checked ? colors.mutedText : colors.text,
                  fontSize: 17,
                  fontWeight: "600",
                  textDecorationLine: item.checked ? "line-through" : "none",
                }}
              >
                {item.name}
              </Text>
              {!!item.quantity && (
                <Text
                  style={{
                    color: colors.mutedText,
                    marginTop: 4,
                    textDecorationLine: item.checked ? "line-through" : "none",
                  }}
                >
                  {item.quantity}
                </Text>
              )}
            </View>
          </View>

          <Pressable
            style={{
              minHeight: 40,
              marginTop: 14,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: isBoughtSection
                ? colors.primarySoft
                : colors.surfaceMuted,
            }}
            onPress={() =>
              isBoughtSection ? handleToggleItem(item) : openEditModal(item)
            }
          >
            <Text
              style={{
                color: isBoughtSection ? colors.primarySoftText : colors.text,
                fontWeight: "600",
              }}
            >
              {isBoughtSection ? "Undo - move back to list" : "Edit name or quantity"}
            </Text>
          </Pressable>
        </View>
      </ReanimatedSwipeable>
    );
  }

  const activeItems = items.filter((item) => !item.checked);
  const boughtItems = items
    .filter((item) => item.checked)
    .sort((left, right) => {
      const leftTime = left.updatedAt?.getTime() ?? left.createdAt?.getTime() ?? 0;
      const rightTime =
        right.updatedAt?.getTime() ?? right.createdAt?.getTime() ?? 0;
      return rightTime - leftTime;
    });
  const sections: ItemSection[] = [
    activeItems.length
      ? {
          title: "To buy",
          description: `${activeItems.length} ${
            activeItems.length === 1 ? "item" : "items"
          } remaining`,
          type: "active",
          data: activeItems,
        }
      : null,
    boughtItems.length
      ? {
          title: "Recently bought",
          description: "Tap undo if something was checked by mistake.",
          type: "bought",
          data: boughtItems,
        }
      : null,
  ].filter((section): section is ItemSection => section !== null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 40,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: 22 }}>
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: "700" }}>
              {listName}
            </Text>
            <Text style={{ color: colors.mutedText, marginTop: 7 }}>
              {items.length} items, {checkedCount} checked
            </Text>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
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
                onPress={openAddModal}
              >
                <Text style={{ color: colors.primaryText, fontWeight: "700" }}>
                  + Add item
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
                  backgroundColor: inviteCode
                    ? colors.surface
                    : colors.surfaceMuted,
                }}
                accessibilityRole="button"
                disabled={!inviteCode}
                onPress={() =>
                  navigation.navigate("InviteMember", {
                    listId,
                    listName,
                    inviteCode,
                  })
                }
              >
                <Text style={{ color: colors.text, fontWeight: "700" }}>
                  Invite member
                </Text>
              </Pressable>
            </View>

            {(offlineNotice ||
              syncState.fromCache ||
              syncState.hasPendingWrites) && (
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
                  {offlineNotice ??
                    (syncState.hasPendingWrites
                      ? "Some changes are waiting to sync."
                      : "Offline mode: showing saved items from this device.")}
                </Text>
              </View>
            )}

            {(canDeleteList || canLeaveList) && (
              <Pressable
                style={{
                  minHeight: 48,
                  marginTop: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.dangerBorder,
                  backgroundColor: colors.dangerSurface,
                }}
                accessibilityRole="button"
                onPress={canDeleteList ? confirmDeleteList : confirmLeaveList}
              >
                <Text style={{ color: colors.dangerText, fontWeight: "700" }}>
                  {canDeleteList ? "Delete this list" : "Leave this list"}
                </Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ flex: 1, alignItems: "center", paddingTop: 60 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.mutedText, marginTop: 14 }}>
                Loading items...
              </Text>
            </View>
          ) : (
            <View
              style={{
                alignItems: "center",
                marginTop: 28,
                padding: 28,
                borderRadius: 24,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>
                This list is empty
              </Text>
              <Text
                style={{
                  color: colors.mutedText,
                  marginTop: 10,
                  lineHeight: 22,
                  textAlign: "center",
                }}
              >
                Add the first item. Every member will see it immediately.
              </Text>
            </View>
          )
        }
      />

      <ItemModal
        visible={isModalVisible}
        item={editingItem}
        loading={isSaving}
        onClose={() => {
          if (!isSaving) {
            setIsModalVisible(false);
            setEditingItem(null);
          }
        }}
        onSave={handleSaveItem}
      />
    </View>
  );
}
