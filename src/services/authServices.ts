import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";
import {
    doc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export async function registerUser(
    email: string,
    password: string,
    displayName: string
) {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
            displayName,
        });
    }

    await setDoc(doc(db, "users", result.user.uid), {
        email,
        displayName,
        createdAt: serverTimestamp(),
    });

    return result.user;
}

export async function loginUser(email: string, password: string) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

export async function logoutUser() {
    await signOut(auth);
}