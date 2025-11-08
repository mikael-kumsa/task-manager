import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth' //for user authentication
import { getFirestore } from 'firebase/firestore' //for db op

const firebaseConfig = {
  apiKey: "AIzaSyB9UsNFAY6lgEZa3DWfBFAtr5fFeBdmS_A", //to identify my project
  authDomain: "task-manager-app-87a13.firebaseapp.com", // for auth.
  projectId: "task-manager-app-87a13", // for firestore db 
  storageBucket: "task-manager-app-87a13.firebasestorage.app", 
  messagingSenderId: "243535462632", //for push notification
  appId: "1:243535462632:web:99655676dbe5d3afa9895d"
};

// Initialize firebase

const app = initializeApp(firebaseConfig);

// set up auth services
export const auth = getAuth(app);

//setup firestore db services
export const db = getFirestore(app);

export default app;