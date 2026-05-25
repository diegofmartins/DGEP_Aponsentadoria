import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  collection, 
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfigImport from '../../firebase-applet-config.json';
import { UnifiedSimulation } from './simulationsStore';

// Build Firebase configuration using environment variables preferentially, with fallback to local JSON file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigImport?.apiKey || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigImport?.authDomain || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigImport?.projectId || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigImport?.storageBucket || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigImport?.messagingSenderId || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigImport?.appId || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigImport?.firestoreDatabaseId || ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth();

// Test server connection as requested by framework/skills guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Define Firestore collection Operation Types for error tracing
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Global firestore error logger & exception wrapper
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authorised user information model
export interface SystemUser {
  email: string;
  nome: string;
  role: 'admin' | 'user';
  allowed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Google Pop-up Authentication
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error during Google authentication popup: ', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error during log out: ', error);
    throw error;
  }
}

// Check if user is registered in Firestore
export async function getRegisteredUser(email: string): Promise<SystemUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const path = `users/${normalizedEmail}`;
  try {
    const userDocRef = doc(db, 'users', normalizedEmail);
    const userSnapshot = await getDoc(userDocRef);
    if (userSnapshot.exists()) {
      return userSnapshot.data() as SystemUser;
    }
    
    // Auto-bootstrap master admin diegofmartins@gmail.com
    if (normalizedEmail === 'diegofmartins@gmail.com') {
      const bossUser: SystemUser = {
        email: 'diegofmartins@gmail.com',
        nome: 'Diego Martins',
        role: 'admin',
        allowed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      // Save bootstrapper
      await setDoc(doc(db, 'users', 'diegofmartins@gmail.com'), bossUser);
      return bossUser;
    }
    
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Add/Save restricted user (Admin option)
export async function saveRegisteredUser(user: SystemUser): Promise<void> {
  const normalizedEmail = user.email.trim().toLowerCase();
  const path = `users/${normalizedEmail}`;
  const preparedUser = {
    ...user,
    email: normalizedEmail,
    updatedAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'users', normalizedEmail), preparedUser);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete user (Admin option)
export async function deleteRegisteredUser(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const path = `users/${normalizedEmail}`;
  try {
    await deleteDoc(doc(db, 'users', normalizedEmail));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Fetch all registered users list (Admin panel)
export async function getAllRegisteredUsers(): Promise<SystemUser[]> {
  const path = 'users';
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const list: SystemUser[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as SystemUser);
    });
    
    // Ensure Diego is in the listing even if database doesn't have it yet
    if (!list.some(u => u.email === 'diegofmartins@gmail.com')) {
      const boss: SystemUser = {
        email: 'diegofmartins@gmail.com',
        nome: 'Diego Martins',
        role: 'admin',
        allowed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.push(boss);
    }
    
    return list.sort((a, b) => a.email.localeCompare(b.email));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Firestore Simulations Operations (Replaces file-based local api endpoint!)
export async function getFirestoreSimulations(): Promise<UnifiedSimulation[]> {
  const path = 'simulations';
  try {
    const querySnapshot = await getDocs(collection(db, 'simulations'));
    const sims: UnifiedSimulation[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      sims.push(data as UnifiedSimulation);
    });
    return sims.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function writeFirestoreSimulation(sim: UnifiedSimulation): Promise<void> {
  const path = `simulations/${sim.id}`;
  try {
    await setDoc(doc(db, 'simulations', sim.id), sim);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFirestoreSimulation(id: string): Promise<void> {
  const path = `simulations/${id}`;
  try {
    await deleteDoc(doc(db, 'simulations', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
