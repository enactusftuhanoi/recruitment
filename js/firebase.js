// firebase.js - Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuTvBn8Xl01DYddVXQ7M0L24K3l-GyG0c",
    authDomain: "enactusftuhanoi-tracuu.firebaseapp.com",
    projectId: "enactusftuhanoi-tracuu",
    storageBucket: "enactusftuhanoi-tracuu",
    messagingSenderId: "611356979403",
    appId: "1:611356979403:web:2c9a4cffb2b323ce3deb4e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();