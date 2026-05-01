import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    onSnapshot,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ================= FIREBASE =================
const firebaseConfig = {
    apiKey: "AIzaSyB-vWhdcOYRayZ8YHACJ-fvzpci0eWKRGQ",
    authDomain: "anos-kasirmieayam.firebaseapp.com",
    projectId: "anos-kasirmieayam",
};

// 🔥 INIT
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔥 FORMAT RUPIAH
function rupiah(angka) {
    return new Intl.NumberFormat("id-ID").format(angka);
}

// 🔥 CHART
let chart;

// 🔥 LOAD DASHBOARD
function loadDashboard() {
    onSnapshot(collection(db, "transaksi"), (snapshot) => {

        let pendapatanHariIni = 0;
        let transaksiHariIni = 0;
        let perHari = {};

        const today = new Date();
        const todayStr = today.toLocaleDateString("sv-SE");

        // 🔥 siapkan 7 hari terakhir (termasuk hari ini)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);

            const key = d.toLocaleDateString("sv-SE"); // yyyy-mm-dd
            const label = d.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit"
            }); // 01/05

            last7Days.push({ key, label });
            perHari[key] = 0; // default 0 biar tetap tampil
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();

            // 🔥 ambil tanggal dari createdAt (utama), fallback aman
            const trxDate = data.createdAt?.toDate
                ? data.createdAt.toDate()
                : data.createdAt
                    ? new Date(data.createdAt)
                    : data.waktu_raw
                        ? new Date(data.waktu_raw)
                        : data.waktu
                            ? new Date(data.waktu)
                            : null;

            if (!trxDate || isNaN(trxDate.getTime())) return;

            const trxStr = trxDate.toLocaleDateString("sv-SE");

            // 💰 hitung hari ini
            if (trxStr === todayStr) {
                pendapatanHariIni += Number(data.total || 0);
                transaksiHariIni++;
            }

            // 📊 hanya masuk 7 hari terakhir
            if (perHari[trxStr] !== undefined) {
                perHari[trxStr] += Number(data.total || 0);
            }
        });

        // 🔥 UPDATE UI
        document.getElementById("pendapatanHariIni").innerText = rupiah(pendapatanHariIni);
        document.getElementById("transaksiHariIni").innerText = transaksiHariIni;

        // 📈 CHART 7 hari terakhir
        const ctx = document.getElementById("salesChart");

        if (ctx) {
            if (chart) chart.destroy();

            const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, "rgba(34,197,94,0.28)");
            gradient.addColorStop(1, "rgba(34,197,94,0.02)");

            chart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: last7Days.map(d => d.label),
                    datasets: [{
                        label: "Penjualan 7 Hari",
                        data: last7Days.map(d => perHari[d.key]),
                        borderColor: "#22c55e",
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: "#22c55e",
                        pointBorderColor: "#fff",
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: "index"
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: "#111827",
                            titleColor: "#fff",
                            bodyColor: "#fff",
                            padding: 12,
                            cornerRadius: 10,
                            displayColors: false,
                            callbacks: {
                                label: (ctx) => ` Rp ${rupiah(ctx.raw)}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: "#6b7280",
                                font: {
                                    size: 12
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: "#f1f5f9"
                            },
                            ticks: {
                                color: "#6b7280",
                                callback: (value) => "Rp " + rupiah(value)
                            }
                        }
                    }
                }
            });
        }

    });
}
// 🔥 AUTO JALAN
window.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});