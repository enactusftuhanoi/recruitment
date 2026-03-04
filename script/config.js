// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrHfc2ERn3oxu6va8RkAckxiBoo6GocgM",
  authDomain: "enactusftuhanoi.firebaseapp.com",
  projectId: "enactusftuhanoi",
  storageBucket: "enactusftuhanoi.firebasestorage.app",
  messagingSenderId: "281439714678",
  appId: "1:281439714678:web:c310c2836e4ca7ad38ce57",
  measurementId: "G-4V8B3GJ38D"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Make them globally available
window.auth = auth;
window.db = db;
