import { deleteApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
} from "firebase/auth";
import {
  arrayUnion,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const projectId = "cartmate-local";
const runId = Date.now();
const inviteCode = "TEST1234";
const password = "Cartmate-test-123!";

const appA = initializeApp(
  { apiKey: "demo-key", authDomain: "localhost", projectId },
  `account-a-${runId}`
);
const appB = initializeApp(
  { apiKey: "demo-key", authDomain: "localhost", projectId },
  `account-b-${runId}`
);

const authA = getAuth(appA);
const authB = getAuth(appB);
const dbA = getFirestore(appA);
const dbB = getFirestore(appB);

connectAuthEmulator(authA, "http://127.0.0.1:9199", {
  disableWarnings: true,
});
connectAuthEmulator(authB, "http://127.0.0.1:9199", {
  disableWarnings: true,
});
connectFirestoreEmulator(dbA, "127.0.0.1", 8180);
connectFirestoreEmulator(dbB, "127.0.0.1", 8180);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForItemCount(db, listId, expectedCount) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(
        new Error(`Timed out waiting for ${expectedCount} real-time items.`)
      );
    }, 5000);

    const unsubscribe = onSnapshot(
      collection(db, "lists", listId, "items"),
      (snapshot) => {
        if (snapshot.size === expectedCount) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(snapshot);
        }
      },
      (error) => {
        clearTimeout(timeout);
        unsubscribe();
        reject(error);
      }
    );
  });
}

async function waitForItemChecked(db, listId, itemId, expectedChecked) {
  return new Promise((resolve, reject) => {
    const itemDocument = doc(db, "lists", listId, "items", itemId);
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(
        new Error(`Timed out waiting for checked=${expectedChecked}.`)
      );
    }, 5000);

    const unsubscribe = onSnapshot(
      itemDocument,
      (snapshot) => {
        if (snapshot.data()?.checked === expectedChecked) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(snapshot);
        }
      },
      (error) => {
        clearTimeout(timeout);
        unsubscribe();
        reject(error);
      }
    );
  });
}

let listRef;
let itemRef;
let userA;
let userB;

try {
  userA = (
    await createUserWithEmailAndPassword(
      authA,
      `cartmate-a-${runId}@example.test`,
      password
    )
  ).user;
  userB = (
    await createUserWithEmailAndPassword(
      authB,
      `cartmate-b-${runId}@example.test`,
      password
    )
  ).user;

  listRef = doc(collection(dbA, "lists"));
  const inviteRefA = doc(dbA, "inviteCodes", inviteCode);

  await runTransaction(dbA, async (transaction) => {
    const existingInvite = await transaction.get(inviteRefA);
    assert(!existingInvite.exists(), "Test invite code already exists.");

    transaction.set(listRef, {
      name: "Two account test",
      ownerId: userA.uid,
      memberIds: [userA.uid],
      inviteCode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(inviteRefA, {
      listId: listRef.id,
      ownerId: userA.uid,
      createdAt: serverTimestamp(),
    });
  });

  const accountALists = await getDocs(
    query(
      collection(dbA, "lists"),
      where("memberIds", "array-contains", userA.uid)
    )
  );
  assert(accountALists.size === 1, "Account A cannot read its new list.");
  const inviteScreenList = await getDoc(listRef);
  assert(
    inviteScreenList.data()?.name === "Two account test"
      && inviteScreenList.data()?.inviteCode === inviteCode,
    "Invite screen list name or code is unavailable."
  );

  const accountAInviteQuery = await getDocs(
    query(
      collection(dbA, "lists"),
      where("memberIds", "array-contains", userA.uid),
      where("inviteCode", "==", inviteCode)
    )
  );
  assert(
    accountAInviteQuery.size === 1,
    "Existing membership was not found by invite code."
  );

  const inviteForB = await getDoc(doc(dbB, "inviteCodes", inviteCode));
  assert(inviteForB.exists(), "Account B cannot read the invite code.");

  await updateDoc(doc(dbB, "lists", listRef.id), {
    memberIds: arrayUnion(userB.uid),
    updatedAt: serverTimestamp(),
  });

  const accountBLists = await getDocs(
    query(
      collection(dbB, "lists"),
      where("memberIds", "array-contains", userB.uid)
    )
  );
  assert(accountBLists.size === 1, "Account B did not join the list.");

  const itemArrivedForB = waitForItemCount(dbB, listRef.id, 1);
  itemRef = doc(collection(dbA, "lists", listRef.id, "items"));
  const addBatch = writeBatch(dbA);
  addBatch.set(itemRef, {
    name: "Milk",
    quantity: "2 cartons",
    checked: false,
    createdBy: userA.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  addBatch.update(listRef, { updatedAt: serverTimestamp() });
  await addBatch.commit();
  await itemArrivedForB;

  const checkedForA = waitForItemChecked(dbA, listRef.id, itemRef.id, true);
  const checkBatch = writeBatch(dbB);
  checkBatch.update(doc(dbB, "lists", listRef.id, "items", itemRef.id), {
    checked: true,
    updatedAt: serverTimestamp(),
  });
  checkBatch.update(doc(dbB, "lists", listRef.id), {
    updatedAt: serverTimestamp(),
  });
  await checkBatch.commit();
  await checkedForA;

  const editBatch = writeBatch(dbA);
  editBatch.update(itemRef, {
    name: "Oat milk",
    quantity: "3 cartons",
    updatedAt: serverTimestamp(),
  });
  editBatch.update(listRef, { updatedAt: serverTimestamp() });
  await editBatch.commit();

  const editedForB = await getDoc(
    doc(dbB, "lists", listRef.id, "items", itemRef.id)
  );
  assert(
    editedForB.data()?.name === "Oat milk",
    "Account A edit did not sync to Account B."
  );

  const itemRemovedForA = waitForItemCount(dbA, listRef.id, 0);
  const deleteItemBatch = writeBatch(dbB);
  deleteItemBatch.delete(
    doc(dbB, "lists", listRef.id, "items", itemRef.id)
  );
  deleteItemBatch.update(doc(dbB, "lists", listRef.id), {
    updatedAt: serverTimestamp(),
  });
  await deleteItemBatch.commit();
  await itemRemovedForA;
  itemRef = undefined;

  let memberDeleteDenied = false;
  try {
    await deleteDoc(doc(dbB, "lists", listRef.id));
  } catch (error) {
    memberDeleteDenied = error?.code === "permission-denied";
  }
  assert(memberDeleteDenied, "A non-owner was able to delete the whole list.");

  const deleteListBatch = writeBatch(dbA);
  deleteListBatch.delete(inviteRefA);
  deleteListBatch.delete(listRef);
  await deleteListBatch.commit();
  listRef = undefined;

  console.log(
    "PASS: invite data loaded, membership-by-code detected, two users joined, real-time add/check/edit/delete synced, and owner-only deletion was enforced."
  );
} finally {
  if (itemRef) {
    await deleteDoc(itemRef).catch(() => undefined);
  }
  if (listRef) {
    await deleteDoc(doc(dbA, "inviteCodes", inviteCode)).catch(() => undefined);
    await deleteDoc(listRef).catch(() => undefined);
  }
  if (authA.currentUser) {
    await deleteUser(authA.currentUser).catch(() => undefined);
  }
  if (authB.currentUser) {
    await deleteUser(authB.currentUser).catch(() => undefined);
  }
  await Promise.all([deleteApp(appA), deleteApp(appB)]);
}
