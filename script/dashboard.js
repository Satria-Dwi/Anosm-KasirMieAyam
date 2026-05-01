import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ================= FIREBASE =================
const firebaseConfig = {
    apiKey: "AIzaSyB-vWhdcOYRayZ8YHACJ-fvzpci0eWKRGQ",
    authDomain: "anos-kasirmieayam.firebaseapp.com",
    projectId: "anos-kasirmieayam",
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= FORMAT =================
function rupiah(angka) {
    return new Intl.NumberFormat("id-ID").format(angka);
}

let chart = null;

// ================= LOAD DASHBOARD =================
function loadDashboard() {
    onSnapshot(collection(db, "transaksi"), (snapshot) => {
        let pendapatanHariIni = 0;
        let transaksiHariIni = 0;
        let perHari = {};

        const todayStr = new Date().toLocaleDateString("sv-SE");

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();

            // 🔥 pakai createdAt (utama), fallback ke waktu_raw / waktu
            const trxDate = data.createdAt?.toDate
                ? data.createdAt.toDate()
                : data.createdAt
                    ? new Date(data.createdAt)
                    : data.waktu_raw
                        ? new Date(data.waktu_raw)
                        : data.waktu
                            ? new Date(data.waktu)
                            : null;

            if (!trxDate || isNaN(trxDate)) return;

            const trxStr = trxDate.toLocaleDateString("sv-SE");

            // 💰 Hari ini
            if (trxStr === todayStr) {
                pendapatanHariIni += Number(data.total || 0);
                transaksiHariIni++;
            }

            // 📊 Rekap per hari
            const tgl = trxDate.toLocaleDateString("id-ID");

            if (!perHari[tgl]) perHari[tgl] = 0;
            perHari[tgl] += Number(data.total || 0);
        });

        // 🔥 UPDATE UI
        document.getElementById("pendapatanHariIni").innerText = rupiah(pendapatanHariIni);
        document.getElementById("transaksiHariIni").innerText = transaksiHariIni;

        // 📈 SORT chart by date
        const sorted = Object.entries(perHari).sort((a, b) => {
            const d1 = new Date(a[0].split("/").reverse().join("-"));
            const d2 = new Date(b[0].split("/").reverse().join("-"));
            return d1 - d2;
        });

        const labels = sorted.map(i => i[0]);
        const values = sorted.map(i => i[1]);

        // 📈 CHART
        const ctx = document.getElementById("salesChart");

        if (ctx) {
            if (chart) chart.destroy();

            chart = new Chart(ctx, {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: "Penjualan",
                        data: values,
                        tension: 0.35,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    });
}

// ================= START =================
window.addEventListener("DOMContentLoaded", loadDashboard);