export function checkAuth(allowedRoles = []) {
    const currentUser = JSON.parse(localStorage.getItem("user"));

    // 🔥 ambil base path project
    const BASE = "/Anoms-Transc-KasirMieAyam";

    // ❌ belum login
    if (!currentUser) {
        window.location.href = BASE + "/";
        return;
    }

    // ❌ tidak punya role
    if (!currentUser.role) {
        window.location.href = BASE + "/";
        return;
    }

    // ❌ role tidak diizinkan
    if (allowedRoles.length && !allowedRoles.includes(currentUser.role)) {
        alert("Akses ditolak!");
        window.location.href = BASE + "/views/dashboard/";
        return;
    }
}