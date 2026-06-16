import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type {
  DocumentData,
  DocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { FirestoreSyncState, ShoppingList } from "../types/shopping";

const INVITE_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 8;
const DELETE_BATCH_SIZE = 400;

function generateInviteCode() {
  let code = "";

  for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
    const characterIndex = Math.floor(
      Math.random() * INVITE_CODE_CHARACTERS.length
    );
    code += INVITE_CODE_CHARACTERS[characterIndex];
  }

  return code;
}

function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function mapShoppingList(
  snapshot: DocumentSnapshot<DocumentData>
): ShoppingList {
  const data = snapshot.data();

  if (!data) {
    throw new Error("Shopping list data is missing.");
  }

  return {
    id: snapshot.id,
    name: data.name,
    ownerId: data.ownerId,
    memberIds: data.memberIds ?? [],
    inviteCode: data.inviteCode,
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  };
}

function sortLists(lists: ShoppingList[]) {
  return [...lists].sort((left, right) => {
    const leftTime = left.updatedAt?.getTime() ?? 0;
    const rightTime = right.updatedAt?.getTime() ?? 0;
    return rightTime - leftTime;
  });
}

export async function createShoppingList(name: string, userId: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("List name is required.");
  }

  const listRef = doc(collection(db, "lists"));

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCode();
    const inviteRef = doc(db, "inviteCodes", inviteCode);

    const created = await runTransaction(db, async (transaction) => {
      const inviteSnapshot = await transaction.get(inviteRef);

      if (inviteSnapshot.exists()) {
        return false;
      }

      transaction.set(listRef, {
        name: trimmedName,
        ownerId: userId,
        memberIds: [userId],
        inviteCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      transaction.set(inviteRef, {
        listId: listRef.id,
        ownerId: userId,
        createdAt: serverTimestamp(),
      });

      return true;
    });

    if (created) {
      return listRef.id;
    }
  }

  throw new Error("Could not generate a unique invite code.");
}

export async function getUsersLists(userId: string) {
  const listsQuery = query(
    collection(db, "lists"),
    where("memberIds", "array-contains", userId)
  );
  const snapshot = await getDocs(listsQuery);
  return sortLists(snapshot.docs.map(mapShoppingList));
}

export function listenToUsersLists(
  userId: string,
  onChange: (lists: ShoppingList[], syncState: FirestoreSyncState) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const listsQuery = query(
    collection(db, "lists"),
    where("memberIds", "array-contains", userId)
  );

  return onSnapshot(
    listsQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      onChange(sortLists(snapshot.docs.map(mapShoppingList)), {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (error) => onError?.(error)
  );
}

export function listenToShoppingList(
  listId: string,
  onChange: (
    list: ShoppingList | null,
    syncState: FirestoreSyncState
  ) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "lists", listId),
    { includeMetadataChanges: true },
    (snapshot) => {
      onChange(snapshot.exists() ? mapShoppingList(snapshot) : null, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (error) => onError?.(error)
  );
}

export async function joinListByInviteCode(code: string, userId: string) {
  const normalizedCode = normalizeInviteCode(code);

  if (!normalizedCode) {
    throw new Error("Invite code is required.");
  }

  const existingMembershipQuery = query(
    collection(db, "lists"),
    where("memberIds", "array-contains", userId),
    where("inviteCode", "==", normalizedCode)
  );
  const existingMembership = await getDocs(existingMembershipQuery);

  if (!existingMembership.empty) {
    throw new Error("You are already a member of this list.");
  }

  const inviteSnapshot = await getDoc(
    doc(db, "inviteCodes", normalizedCode)
  );

  if (!inviteSnapshot.exists()) {
    throw new Error("Invite code was not found.");
  }

  const listId = inviteSnapshot.data().listId as string;

  await updateDoc(doc(db, "lists", listId), {
    memberIds: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });

  return listId;
}

export async function leaveShoppingList(list: ShoppingList, userId: string) {
  if (list.ownerId === userId) {
    throw new Error("Owners can delete the list instead of leaving it.");
  }

  await updateDoc(doc(db, "lists", list.id), {
    memberIds: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteShoppingList(list: ShoppingList) {
  const itemsSnapshot = await getDocs(
    collection(db, "lists", list.id, "items")
  );

  for (
    let startIndex = 0;
    startIndex < itemsSnapshot.docs.length;
    startIndex += DELETE_BATCH_SIZE
  ) {
    const batch = writeBatch(db);
    const documents = itemsSnapshot.docs.slice(
      startIndex,
      startIndex + DELETE_BATCH_SIZE
    );

    documents.forEach((itemSnapshot) => {
      batch.delete(itemSnapshot.ref);
    });

    await batch.commit();
  }

  const finalBatch = writeBatch(db);
  finalBatch.delete(doc(db, "inviteCodes", list.inviteCode));
  finalBatch.delete(doc(db, "lists", list.id));
  await finalBatch.commit();
}
