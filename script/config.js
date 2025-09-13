// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAOP2j0qV0Ge-q2-Y9zo9Qc3eLmgtVOK3k",
    authDomain: "recruitment-enactusftuhanoi.firebaseapp.com",
    projectId: "recruitment-enactusftuhanoi",
    storageBucket: "recruitment-enactusftuhanoi.firebasestorage.app",
    messagingSenderId: "658928769643",
    appId: "1:658928769643:web:ef4e26633b7c41c922ef2e",
    measurementId: "G-BJT7ZPKYE3"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();