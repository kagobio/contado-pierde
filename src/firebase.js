import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBIejxsavxmMDHdRgNBzbGhV-9xKHM-Joo",
  authDomain: "contado-pierde.firebaseapp.com",
  projectId: "contado-pierde",
  storageBucket: "contado-pierde.firebasestorage.app",
  messagingSenderId: "386759948648",
  appId: "1:386759948648:web:e8e855ba94a5ecaa52fedd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Secondary app instance — used by admins to create users without
// signing out from the main session
const secondaryApp = initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);
