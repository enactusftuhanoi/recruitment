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

// Export các biến để sử dụng trong các file HTML
window.firebaseApp = firebase.app();
window.firebaseDb = firebase.firestore();
window.firebaseAuth = firebase.auth();