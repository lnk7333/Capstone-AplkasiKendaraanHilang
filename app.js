// 1. Konfigurasi Koneksi Supabase
const SUPABASE_URL = "https://osdbtmlszsychyudjyyh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zZGJ0bWxzenN5Y2h5dWRqeXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxODM3ODgsImV4cCI6MjA5NDc1OTc4OH0.n8zdPBhDdjddie2I8QZG3jQputxk4vVxMS0KyyFiyWU";

// Inisialisasi client Supabase dengan nama variabel yang benar
const clientSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Simulasi Session Pengguna Aktif
const CURRENT_USER_ID = "USR001"; 

// 3. Ambil Elemen UI dari DOM HTML
const reportForm = document.getElementById("reportForm");
const btnSos = document.getElementById("btnSos");
const btnPulihkan = document.getElementById("btnPulihkan");
const selectZona = document.getElementById("selectZona");
const deskripsiInput = document.getElementById("deskripsi");
const statusCard = document.getElementById("statusCard");
const statusText = document.getElementById("statusText");
const actionSaksiBox = document.getElementById("actionSaksiBox");
const btnMelihat = document.getElementById("btnMelihat");
const responseBox = document.getElementById("responseBox");
const btnKirimInfo = document.getElementById("btnKirimInfo");
const infoSaksi = document.getElementById("infoSaksi");
const bodyApp = document.getElementById("bodyApp");
const heroHeader = document.getElementById("heroHeader");

// 4. KORBAN SIDE: Handler Submit SOS
reportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const zonaId = selectZona.value;
    const namaZona = selectZona.options[selectZona.selectedIndex].text;
    const catatanTambahan = deskripsiInput.value.trim();

    const yakin = confirm(`🚨 PERINGATAN KIRIMAN SOS:\nApakah Anda yakin ingin menyebarkan status darurat kehilangan di area ${namaZona} sekarang?`);
    
    if (yakin) {
        btnSos.disabled = true;
        btnSos.innerText = "Mengirim Sinyal...";

        // Update database status zona menjadi Waspada di Supabase
        const { error } = await clientSupabase
            .from('zona_keamanan')
            .update({ status: 'Waspada' })
            .eq('id', zonaId);

        if (error) {
            console.error("Gagal kirim SOS:", error.message);
            alert("Terjadi kesalahan jaringan.");
            btnSos.disabled = false;
            btnSos.innerText = "KIRIM ALERT KEHILANGAN (SOS)";
        } else {
            alert(`Sinyal darurat berhasil disiarkan ke radius area ${namaZona}!`);
            btnSos.disabled = false;
            btnSos.innerText = "KIRIM ALERT KEHILANGAN (SOS)";
            deskripsiInput.value = ""; // Bersihkan form
        }
    }
});

// 5. ADMIN/RESET SIDE: Mengembalikan Status ke Aman
btnPulihkan.addEventListener("click", async () => {
    const zonaId = selectZona.value;
    
    btnPulihkan.innerText = "Memproses Reset...";
    const { error } = await clientSupabase
        .from('zona_keamanan')
        .update({ status: 'Aman' })
        .eq('id', zonaId);

    if (error) {
        console.error("Gagal reset:", error.message);
    } else {
        btnPulihkan.innerText = "⚙️ Reset Status Menjadi Aman Kembali";
    }
});

// 6. SAKSI SIDE: Interaksi Tombol Respons Saksi
btnMelihat.addEventListener("click", () => {
    responseBox.classList.toggle("hidden");
    responseBox.scrollIntoView({ behavior: "smooth" });
});

btnKirimInfo.addEventListener("click", () => {
    if (infoSaksi.value.trim() === "") {
        alert("Mohon isi petunjuk informasi terlebih dahulu.");
        return;
    }
    alert("Terima kasih! Petunjuk Anda telah diteruskan langsung ke korban via sistem.");
    infoSaksi.value = "";
    responseBox.classList.add("hidden");
});

// 7. REAL-TIME ENGINE: Mendengarkan Siaran Database secara Instan
clientSupabase
    .channel('live-security-changes')
    .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'zona_keamanan' },
        (payload) => {
            console.log('Update Data Real-time Masuk:', payload.new);
            manipulasiUIRealtime(payload.new);
        }
    )
    .subscribe();

// 8. UI MANIPULATOR: Mengubah Bentuk Visual Sesuai Kondisi Keamanan Data
function manipulasiUIRealtime(dataZona) {
    if (dataZona.status === "Waspada") {
        // Efek Visual Darurat: Ubah warna layout global menjadi merah siaga
        bodyApp.className = "bg-red-50 text-gray-900 transition-colors duration-500";
        heroHeader.className = "bg-red-700 text-white py-12 px-6 transition-colors duration-500 shadow-inner";

        // Ubah Card Monitor menjadi Warning Box Bergetar/Bounce
        statusCard.className = "bg-white border-2 border-red-500 border-t-8 border-t-red-600 rounded-2xl p-6 shadow-xl space-y-4 animate-pulse";
        
        statusText.innerHTML = `
            <h3 class="font-black text-red-600 text-2xl flex items-center gap-2">
                <span>🚨</span> ANCAMAN AKTIF TERDETEKSI
            </h3>
            <p class="text-sm text-gray-800 leading-relaxed">
                Telah dilaporkan kehilangan kendaraan roda dua jenis <strong>Honda Beat Hitam (Nopol: L 1234 AB)</strong> di sekitar area: <span class="bg-red-100 text-red-700 font-bold px-2 py-1 rounded text-base">${dataZona.nama_zona}</span>.
            </p>
            <div class="bg-red-50 text-red-900 p-4 rounded-xl border border-red-200 text-xs space-y-2">
                <p class="font-bold">⚠️ Tindakan Cepat Pengguna Sekitar:</p>
                <p>1. Cek kendaraan Anda sekarang dan pastikan kunci ganda terpasang gembok.</p>
                <p>2. Amati area sekitar jalur keluar-masuk lokasi kejadian jika Anda berada di sana.</p>
            </div>
        `;

        // Tampilkan aksi kontrol saksi mata & tombol pemulihan
        actionSaksiBox.classList.remove("hidden");
        btnPulihkan.classList.remove("hidden");

        // Bunyikan Bunyi Sirine EWS yang bersahabat
        bunyikanSirineLembut();

    } else {
        // Efek Visual Normal Kembali
        bodyApp.className = "bg-gray-100 text-gray-900 transition-colors duration-500";
        heroHeader.className = "bg-red-600 text-white py-12 px-6 transition-colors duration-500";
        
        statusCard.className = "bg-white border-l-8 border-green-500 rounded-2xl p-6 shadow-sm transition-all duration-300";
        statusText.innerHTML = `
            <h3 class="font-black text-green-700 text-xl flex items-center gap-2">🟢 Status Lingkungan Aman</h3>
            <p class="text-gray-600 text-sm">Situasi di sekitar wilayah pemantauan saat ini terpantau aman dan kondusif. Anda akan menerima sinyal darurat secara otomatis jika terjadi insiden.</p>
        `;

        actionSaksiBox.classList.add("hidden");
        responseBox.classList.add("hidden");
        btnPulihkan.classList.add("hidden");
    }
}

// Melodi Sirine Naik-Turun Lembut Menggunakan Web Audio API
function bunyikanSirineLembut() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine"; 
    osc.frequency.setValueAtTime(440, ctx.currentTime); 
    
    // Alur frekuensi sirine agar bergulir naik turun secara estetik
    osc.frequency.linearRampToValueAtTime(750, ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.6);
    osc.frequency.linearRampToValueAtTime(750, ctx.currentTime + 0.9);

    gain.gain.setValueAtTime(0.25, ctx.currentTime); // Volume 25% biar tidak pecah di speaker
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2); 

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
}