import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB-vWhdcOYRayZ8YHACJ-fvzpci0eWKRGQ",
    authDomain: "anos-kasirmieayam.firebaseapp.com",
    projectId: "anos-kasirmieayam",
    storageBucket: "anos-kasirmieayam.firebasestorage.app",
    messagingSenderId: "561871364968",
    appId: "1:561871364968:web:170152a933d38787796cdd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// export db saja
export { db };