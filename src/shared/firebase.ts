import { FirebaseApp, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { Cacheable } from "./cacheable";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  where,
  query,
  updateDoc,
} from "firebase/firestore";
import { userId } from "../state/user-id";

let app: FirebaseApp | null = null;

export class CartarioFirebaseError extends Error {}

export class CartarioFirebaseNotFoundError extends CartarioFirebaseError {}

const cacheableApp = new Cacheable(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyAQtOBk_eC1kdYXKWQOvvIw5pNn4W9cN0o",
    authDomain: "konasov.space",
    projectId: "cartario-d8414",
    storageBucket: "cartario-d8414.firebasestorage.app",
    messagingSenderId: "913905705485",
    appId: "1:913905705485:web:42c9fc2dce6cbfd2f22b44",
  };

  app = initializeApp(firebaseConfig);

  return Promise.resolve(app);
});

const cacheableFirestoreDb = new Cacheable(async () => {
  const app = await cacheableApp.get();
  const firestore = getFirestore(app);

  return firestore;
});

export async function initFirebase() {
  return await cacheableApp.get();
}

export async function authWithGoogle() {
  if (userId.get()) return;
  const app = await initFirebase();
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  const result = await getRedirectResult(auth);

  if (!result) {
    signInWithRedirect(auth, provider);

    return;
  }

  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential) {
    throw new Error("Failed to process credential");
  }

  const token = credential.accessToken ?? "";
  const user = result.user;
  userId.set(user.uid);

  return [user, token] as const;
}

export async function getFirestoreCollection(collectionName: string) {
  const db = await cacheableFirestoreDb.get();
  const whereClause = where("userId", "==", userId.get());
  const q = query(collection(db, collectionName), whereClause);
  const snapshot = await getDocs(q);
  //   const snapshot = await getDocs(collection(db, collectionName));

  return snapshot.docs.map((doc) => doc.data());
}

export async function getDocuments(collectionName: string, whereClause: ReturnType<typeof where>) {
  const db = await cacheableFirestoreDb.get();
  const q = query(collection(db, collectionName), whereClause, where("userId", "==", userId.get()));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data());
}

export async function findAndUpdateOrThrow(
  collectionName: string,
  data: object,
  ...predicates: ReturnType<typeof where>[]
) {
  const predicatesWithUserId = [...predicates, where("userId", "==", userId.get())];

  const db = await cacheableFirestoreDb.get();
  const q = query(collection(db, collectionName), ...predicatesWithUserId);

  const snapshot = await getDocs(q);

  if (!snapshot.docs[0]) {
    throw new CartarioFirebaseNotFoundError();
  }

  await updateDoc(snapshot.docs[0].ref, { ...data, userId: userId.get() });
}

export async function insertDocument(collectionName: string, doc: object) {
  const db = await cacheableFirestoreDb.get();
  await addDoc(collection(db, collectionName), {
    ...doc,
    userId: userId.get(),
  });
}

export async function deleteFirst(collectionName: string, whereClause: ReturnType<typeof where>) {
  const db = await cacheableFirestoreDb.get();
  const q = query(collection(db, collectionName), whereClause);
  const snapshot = await getDocs(q);

  const firstDoc = snapshot.docs[0];

  if (firstDoc) {
    deleteDoc(firstDoc.ref);
  } else {
    throw new Error("Document not found");
  }
}
