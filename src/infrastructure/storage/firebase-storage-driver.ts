import { where } from "firebase/firestore";
import { StorageDriver } from "./storage-driver";
import * as Firebase from "@shared/firebase";

export class FirebaseStorageDriver implements StorageDriver {
  async get(key: string): Promise<string | null> {
    return (await Firebase.getDocuments("keys", where("key", "==", key)))[0]?.value ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    try {
      await Firebase.findAndUpdateOrThrow("keys", { key, value }, where("key", "==", key));
    } catch (e) {
      if (e instanceof Firebase.CartarioFirebaseNotFoundError) {
        await Firebase.insertDocument("keys", { key, value });
      } else {
        throw e;
      }
    }
  }
  async remove(key: string): Promise<void> {
    await Firebase.deleteFirst("keys", where(key, "==", key));
  }
  async keys(): Promise<string[]> {
    return (await Firebase.getFirestoreCollection("keys")).map((val) => val.key);
  }
}
