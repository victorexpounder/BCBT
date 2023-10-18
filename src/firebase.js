
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "firebase/app";
  import { getAnalytics } from "firebase/analytics";
  import { getAuth} from "firebase/auth";
  import { getFirestore } from "firebase/firestore";
  import { getStorage } from 'firebase/storage';
  
  
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries
  
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  
  const key = process.env.REACT_APP_Key;
  console.log(key)
  const firebaseConfig = {
    apiKey: "AIzaSyCSXhHj-m-nofA5-ogbhAo4zsAXUZ9AGR0",
    authDomain: "bcbt-200a2.firebaseapp.com",
    projectId: "bcbt-200a2",
    storageBucket: "bcbt-200a2.appspot.com",
    messagingSenderId: "314546965017",
    appId: "1:314546965017:web:33c44536a960724ee1f888",
    measurementId: "G-ZZJP7F059Y"
  };
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  export const storage = getStorage(app);
