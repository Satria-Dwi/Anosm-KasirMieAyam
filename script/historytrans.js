import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= STATE =================
let semuaData = [];
let unsubscribe = null;

// ================= LOAD REALTIME =================
function loadData() {
    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);

    const besok = new Date(hariIni);
    besok.setDate(besok.getDate() + 1);

    loadByRange(hariIni, besok);
}

let currentPage = 1;
const perPage = 5;
let allData = [];

// ================= RENDER TABLE =================
window.renderData = function (docs) {
    // urutkan terbaru dulu
    allData = [...docs].sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return tB - tA;
    });

    currentPage = 1;
    renderPage();
};

function renderPage() {
    const list = document.getElementById("list");
    if (!list) return;

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;

    const pageData = allData.slice(start, end);

    let html = "";

    pageData.forEach((d) => {

        const waktu = d.createdAt?.toDate
            ? d.createdAt.toDate().toLocaleString("id-ID")
            : d.waktu || "-";

        const items = (d.items || [])
            .map(i => `${i.nama} (${i.qty})`)
            .join(", ");

        html += `
        <tr>
            <td>${waktu}</td>
            <td>${d.kasir || "-"}</td>
            <td>${items}</td>
            <td>Rp ${formatRupiah(d.total || 0)}</td>
            <td>
                <button onclick="hapusTransaksi('${d.id}')">Hapus</button>
            </td>
        </tr>
        `;
    });

    list.innerHTML = html;
    renderPagination();
}

function renderPagination() {
    const totalPage = Math.ceil(allData.length / perPage) || 1;

    document.getElementById("page-info").innerText =
        `Page ${currentPage} / ${totalPage}`;

    const prev = document.getElementById("prevBtn");
    const next = document.getElementById("nextBtn");

    if (prev) prev.disabled = currentPage === 1;
    if (next) next.disabled = currentPage === totalPage;
}

window.nextPage = function () {
    const totalPage = Math.ceil(allData.length / perPage);
    if (currentPage < totalPage) {
        currentPage++;
        renderPage();
    }
};

window.prevPage = function () {
    if (currentPage > 1) {
        currentPage--;
        renderPage();
    }
};

function hitungItemHariIni(docs) {
    const hasil = {};

    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);

    docs.forEach(d => {
        const tgl = d.createdAt?.toDate
            ? d.createdAt.toDate()
            : (d.createdAt ? new Date(d.createdAt) : null);
        if (!tgl) return;

        // hanya ambil hari ini
        if (tgl >= hariIni) {
            (d.items || []).forEach(item => {
                if (!hasil[item.nama]) {
                    hasil[item.nama] = 0;
                }
                hasil[item.nama] += item.qty;
            });
        }
    });

    renderItemHariIni(hasil);
}

function renderItemHariIni(data) {
    const el = document.getElementById("item-harian");
    if (!el) return;

    let html = "";

    // urutkan dari yang paling banyak
    Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .forEach(([nama, jumlah]) => {
            html += `
            <tr>
                <td>${nama}</td>
                <td>${jumlah}</td>
            </tr>
            `;
        });

    el.innerHTML = html || `
        <tr>
            <td colspan="2"><i>Tidak ada data hari ini</i></td>
        </tr>
    `;
    renderChart(data);
}

let chartHarian = null;

function renderChart(data) {
    const canvas = document.getElementById("chart-harian");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // 🔥 ambil top 5 biar clean
    const sorted = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const labels = sorted.map(i => i[0]);
    const values = sorted.map(i => i[1]);

    // 🔥 gradient warna
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "#4f46e5");
    gradient.addColorStop(1, "#22c55e");

    // destroy chart lama
    if (chartHarian) chartHarian.destroy();

    chartHarian = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Jumlah Terjual",
                data: values,
                backgroundColor: gradient,
                borderRadius: 10,
                borderSkipped: false,
                barThickness: 35,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            animation: {
                duration: 800,
                easing: "easeOutQuart"
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: "#111827",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function (ctx) {
                            return ` ${ctx.raw} terjual`;
                        }
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
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function hitungItem(docs) {
    const hasil = {};

    docs.forEach(d => {
        (d.items || []).forEach(item => {
            if (!hasil[item.nama]) {
                hasil[item.nama] = 0;
            }
            hasil[item.nama] += item.qty;
        });
    });

    renderItemHariIni(hasil);
}

// ================= DELETE =================
window.hapusTransaksi = async function (id) {
    if (confirm("Yakin mau hapus transaksi ini?")) {
        await deleteDoc(doc(db, "transaksi", id));
    }
};

// ================= SUMMARY =================
function updateSummary(docs) {
    const total = docs.reduce((a, b) => a + (b.total || 0), 0);

    const totalEl = document.getElementById("total");
    const jumlahEl = document.getElementById("jumlahTransaksi");

    if (totalEl) totalEl.innerText = formatRupiah(total);
    if (jumlahEl) jumlahEl.innerText = docs.length;
}

// ================= FILTER TANGGAL =================
window.filterTanggal = function () {
    let start = document.getElementById("start").value;
    let end = document.getElementById("end").value;

    if (!start || !end) {
        alert("Isi tanggal dulu!");
        return;
    }

    let startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    let endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    loadByRange(startDate, endDate);
};

// ================= RESET FILTER =================
window.resetFilter = function () {
    loadData();

    document.querySelectorAll(".quick-filter button")
        .forEach(btn => btn.classList.remove("active"));
};
window.filterCepat = function (hari, el) {

    const sekarang = new Date();
    sekarang.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(sekarang.getDate() - (hari - 1));
    startDate.setHours(0, 0, 0, 0);

    loadByRange(startDate, sekarang);

    if (el) setActiveButton(el);
};

// ================= EXPORT CSV =================
window.exportCSV = function () {
    let csv = "Waktu,Kasir,Item,Total\n";

    semuaData.forEach(d => {
        const waktu = d.createdAt?.toDate
            ? d.createdAt.toDate().toLocaleString("id-ID")
            : d.waktu || "-";

        const items = (d.items || [])
            .map(i => `${i.nama}(${i.qty})`)
            .join(" | ");

        csv += `${waktu},${d.kasir || "-"},${items},${d.total}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "rekapan.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url); // 🔥 cleanup
};

// ================= FORMAT RUPIAH =================
function formatRupiah(angka) {
    return angka.toLocaleString("id-ID");
}

window.setActiveButton = function (el) {
    document.querySelectorAll(".quick-filter button")
        .forEach(btn => btn.classList.remove("active"));

    el.classList.add("active");
};

function loadByRange(startDate, endDate) {

    // 🔥 matikan listener lama
    if (unsubscribe) unsubscribe();

    const q = query(
        collection(db, "transaksi"),
        where("createdAt", ">=", startDate),
        where("createdAt", "<", endDate)
    );

    unsubscribe = onSnapshot(q, (snapshot) => {

        const docs = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        semuaData = docs;

        renderData(docs);
        updateSummary(docs);
        hitungItem(docs);
    });
}

// ================= START =================
loadData();
