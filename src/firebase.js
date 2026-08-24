import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAp20mDT4qJaaG_E2VZ6E73aM5WfJ1s8kc",
  authDomain: "voiladarkroom1.firebaseapp.com",
  projectId: "voiladarkroom1",
  storageBucket: "voiladarkroom1.firebasestorage.app",
  messagingSenderId: "808276682190",
  appId: "1:808276682190:web:eac129c675eef1f248779f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// Send Firebase Auth system emails (member invites / password resets) in Spanish
auth.languageCode = 'es';

// Secondary app instance — used by admins to create users without
// signing out from the main session
const secondaryApp = initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);
