// auth.js - Authentication handling
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed in
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                loginError.textContent = error.message;
                loginError.style.display = 'block';
            });
    });
    
    // Check if user is already logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });
});