document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = document.getElementById('btnText');
  const spinner = document.getElementById('spinner');

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Show loading
    btnText.textContent = 'Đang đăng nhập...';
    spinner.classList.remove('hidden');
    loginBtn.disabled = true;

    try {
      // 1. Firebase authentication
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // 2. Check user role
      const userDoc = await usersRef.doc(user.uid).get();
      
      if (!userDoc.exists) {
        await usersRef.doc(user.uid).set({
          email: user.email,
          role: 'user',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // 3. Redirect based on role
      const role = userDoc.data()?.role || 'user';
      window.location.href = role === 'admin' ? 'dashboard.html' : 'profile.html';

    } catch (error) {
      handleLoginError(error);
    } finally {
      resetLoginButton();
    }
  });

  function handleLoginError(error) {
    let errorMessage;
    switch(error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Email không hợp lệ';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Tài khoản không tồn tại';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Sai mật khẩu';
        break;
      default:
        errorMessage = 'Lỗi đăng nhập. Vui lòng thử lại';
    }

    loginError.textContent = errorMessage;
    loginError.classList.remove('hidden');
  }

  function resetLoginButton() {
    btnText.textContent = 'Đăng nhập';
    spinner.classList.add('hidden');
    loginBtn.disabled = false;
  }

  // Initialize admin account (run once)
  async function initAdminAccount() {
    try {
      const adminEmail = 'admin@enactus.com';
      const adminPassword = 'Admin@123';
      
      const { user } = await auth.createUserWithEmailAndPassword(adminEmail, adminPassword);
      await usersRef.doc(user.uid).set({
        email: adminEmail,
        role: 'admin',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('Admin account created successfully');
    } catch (err) {
      console.log('Admin account already exists or error:', err.message);
    }
  }

  // Uncomment this line only for first time setup
  // initAdminAccount();
});