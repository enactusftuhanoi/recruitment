// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
  authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
  projectId: "enactusftuhanoi-tracuu",
  storageBucket: "enactusftuhanoi-tracuu.appspot.com",
  messagingSenderId: "611356979403",
  appId: "1:611356979403:web:2c9a4cffb2b323ce3deb4e"
};

firebase.initializeApp(firebaseConfig);

// Shortcut các service
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Tạo collection references
const usersRef = db.collection("users");
const candidatesRef = db.collection("candidates");
const roundsRef = db.collection("rounds");