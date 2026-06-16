import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import type {
  DocumentData,
  QueryDocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { commitBatchOptimistically } from "./offlineWrites";
import type {
  FirestoreSyncState,
  ShoppingItem,
  ShoppingItemInput,
} from "../types/shopping";

function mapShoppingItem(
  snapshot: QueryDocumentSnapshot<DocumentData>
): ShoppingItem {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: data.name,
    quantity: data.quantity ?? "",
    checked: data.checked ?? false,
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  };
}

function sortItems(items: ShoppingItem[]) {
  return [...items].sort((left, right) => {
    if (left.checked !== right.checked) {
      return left.checked ? 1 : -1;
    }

    const leftTime = left.createdAt?.getTime() ?? 0;
    const rightTime = right.createdAt?.getTime() ?? 0;
    return leftTime - rightTime;
  });
}

function validateItemInput(input: ShoppingItemInput) {
  const name = input.name.trim();
  const quantity = input.quantity.trim();

  if (!name) {
    throw new Error("Item name is required.");
  }

  return { name, quantity };
}

function listRef(listId: string) {
  return doc(db, "lists", listId);
}

function itemRef(listId: string, itemId: string) {
  return doc(db, "lists", listId, "items", itemId);
}

export async function addItemToList(
  listId: string,
  input: ShoppingItemInput,
  userId: string
) {
  const values = validateItemInput(input);
  const newItemRef = doc(collection(db, "lists", listId, "items"));
  const batch = writeBatch(db);

  batch.set(newItemRef, {
    ...values,
    checked: false,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(listRef(listId), { updatedAt: serverTimestamp() });
  return commitBatchOptimistically(batch);
}

export async function updateItemInList(
  listId: string,
  itemId: string,
  input: ShoppingItemInput
) {
  const values = validateItemInput(input);
  const batch = writeBatch(db);

  batch.update(itemRef(listId, itemId), {
    ...values,
    updatedAt: serverTimestamp(),
  });
  batch.update(listRef(listId), { updatedAt: serverTimestamp() });
  return commitBatchOptimistically(batch);
}

export async function toggleItemChecked(
  listId: string,
  itemId: string,
  checked: boolean
) {
  const batch = writeBatch(db);

  batch.update(itemRef(listId, itemId), {
    checked,
    updatedAt: serverTimestamp(),
  });
  batch.update(listRef(listId), { updatedAt: serverTimestamp() });
  return commitBatchOptimistically(batch);
}

export async function deleteItemFromList(listId: string, itemId: string) {
  const batch = writeBatch(db);
  batch.delete(itemRef(listId, itemId));
  batch.update(listRef(listId), { updatedAt: serverTimestamp() });
  return commitBatchOptimistically(batch);
}

export function listenToListItems(
  listId: string,
  onChange: (
    items: ShoppingItem[],
    syncState: FirestoreSyncState,
    addedItems: ShoppingItem[]
  ) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, "lists", listId, "items"),
    { includeMetadataChanges: true },
    (snapshot) => {
      const items = snapshot.docs.map(mapShoppingItem);
      const addedItems = snapshot
        .docChanges()
        .filter((change) => change.type === "added")
        .map((change) => mapShoppingItem(change.doc));

      onChange(
        sortItems(items),
        {
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        },
        addedItems
      );
    },
    (error) => onError?.(error)
  );
}
