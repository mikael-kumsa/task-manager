import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth' //for user authentication
import { getFirestore } from 'firebase/firestore' //for db op

const firebaseConfig = {
  apiKey: API_KEY, //to identify my project
  authDomain: authdomain.firebaseapp.com, // for auth.
  projectId: PROJECT_ID, // for firestore db 
  storageBucket: STORAGE_BUCKET, 
  messagingSenderId: SENDER_ID, //for push notification
  appId: APP_ID
};

// Initialize firebase

const app = initializeApp(firebaseConfig);

// set up auth services
export const auth = getAuth(app);

//setup firestore db services
export const db = getFirestore(app);

export default app;
