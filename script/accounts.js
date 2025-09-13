// ===== Load danh sách account =====
async function loadAccounts() {
  const tbody = document.querySelector("#accounts-table tbody");
  tbody.innerHTML = "";

  try {
    const snapshot = await db.collection("account").get();
    snapshot.forEach(doc => {
      const data = doc.data();
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${doc.id}</td>
        <td>${data.email}</td>
        <td>${data.role}</td>
        <td>${data.department || ''}</td>
        <td>${data.note || ''}</td>
        <td>
          <button class="action-btn edit" onclick="editAccount('${doc.id}')">✏️</button>
          <button class="action-btn delete" onclick="deleteAccount('${doc.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Lỗi load accounts:", err);
    alert("Không thể tải danh sách account!");
  }
}

// ===== Form =====
function showAddAccountForm() {
  document.getElementById("account-form").reset();
  document.getElementById("account-id").value = "";

  // ✅ cho nhập tên khi thêm mới
  document.getElementById("account-name").disabled = false;

  document.getElementById("account-form-modal").style.display = "flex";
}

function closeForm() {
  document.getElementById("account-form-modal").style.display = "none";
}

// ===== Save (thêm/sửa) =====
document.getElementById("account-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("account-id").value || document.getElementById("account-name").value.trim();

  if (!id) {
    alert("Tên tài khoản (ID) không được để trống!");
    return;
  }

  const data = {
    email: document.getElementById("account-email").value.trim(),
    role: document.getElementById("account-role").value,
    department: document.getElementById("account-department").value,
    note: document.getElementById("account-note").value.trim()
  };

  try {
    await db.collection("account").doc(id).set(data, { merge: true });
    closeForm();
    loadAccounts();
  } catch (err) {
    console.error("Lỗi khi lưu account:", err);
    alert("Không thể lưu account!");
  }
});

// ===== Edit =====
async function editAccount(id) {
  try {
    const docSnap = await db.collection("account").doc(id).get();
    if (!docSnap.exists) return;

    const data = docSnap.data();
    document.getElementById("account-id").value = id;
    document.getElementById("account-name").value = id;

    // ✅ khóa tên khi edit
    document.getElementById("account-name").disabled = true;

    document.getElementById("account-email").value = data.email;
    document.getElementById("account-role").value = data.role;
    document.getElementById("account-department").value = data.department || "";
    document.getElementById("account-note").value = data.note || "";

    document.getElementById("account-form-modal").style.display = "flex";
  } catch (err) {
    console.error("Lỗi khi edit account:", err);
  }
}

// ===== Delete =====
async function deleteAccount(id) {
  if (!confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
  try {
    await db.collection("account").doc(id).delete();
    loadAccounts();
  } catch (err) {
    console.error("Lỗi khi xóa account:", err);
    alert("Không thể xóa account!");
  }
}

// ===== Logout =====
function logout() {
  auth.signOut().then(() => {
    sessionStorage.clear();
    window.location.href = "login.html";
  });
}

// ===== Kiểm tra quyền =====
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const role = sessionStorage.getItem("role");
  if (role !== "superadmin") {
    alert("Bạn không có quyền truy cập trang này");
    window.location.href = "index.html";
    return;
  }
  loadAccounts();
});
