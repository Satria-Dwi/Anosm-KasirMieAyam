import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

export async function simpanTransaksi(data) {
    try {
        const ref = await addDoc(collection(db, "transaksi"), data);
        console.log("✅ Transaksi tersimpan:", ref.id);
        return ref.id;
    } catch (error) {
        console.error("❌ Gagal simpan transaksi:", error);
        throw error;
    }
}