// 1. Buat Peta
let map = L.map('map').setView([-8.006657, 112.618495], 15);


const TombolPencarian = L.Control.extend({
    options: {
        position: 'topleft' // Menempatkan tombol di kiri atas, berdekatan dengan tombol zoom
    },
    onAdd: function (map) {
        // Membuat wadah untuk tombol dengan kelas bawaan Leaflet agar rapi
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

        // Mendesain tombol agar terlihat menyatu dengan gaya Leaflet
        container.innerHTML = `
            <button onclick="cariTerdekat()" style="background-color: white; color: #333; border: none; padding: 8px 12px; cursor: pointer; font-weight: bold; border-radius: 4px; display: flex; align-items: center; gap: 5px;">
                Cari UMKM Terdekat
            </button>
        `;

        // Mencegah peta ikut terklik atau bergeser saat tombol ini ditekan
        L.DomEvent.disableClickPropagation(container);

        return container;
    }
});

// Masukkan tombol ke dalam peta
map.addControl(new TombolPencarian());

// Wadah untuk daftar UMKM
let daftarUMKM = [];

// 2. Tampilan OpenStreetMap
L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);

// 3. Icon Kuliner
let foodIcon = L.icon({
    iconUrl: 'Food.png',
    iconSize: [30,30]
});

// 4. Marker Statis Kantor Kelurahan
L.marker([-8.0070465, 112.6184146])
    .addTo(map)
    .bindPopup("Kantor Kel. Bandungrejosari")
    .openPopup();

// 5. Membaca Data Google Sheet
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnDFQuD4OIXm1Pt0qaDaBAWJXd1jYjIgIEnKaKmWnJt2LEwTqiwmWJXz6SoNqHGlnSQToM5H5yg7TA/pub?output=csv';

Papa.parse(sheetUrl, {
    download: true,
    header: true,
    complete: function(results) {
        console.log("Data Sheet:", results.data);

        // SATUKAN PROSES DI SINI
        results.data.forEach(function(umkm){
            if(umkm.Lat && umkm.Lon){
                
                // Ubah koordinat jadi angka
                const lat = parseFloat(umkm.Lat.replace(',', '.'));
                const lon = parseFloat(umkm.Lon.replace(',', '.'));

                // Buat marker dengan icon, foto, dan link
                const marker = L.marker([lat, lon], {icon : foodIcon})
                    .addTo(map)
                    .bindPopup(`
                        <b>${umkm.Nama}</b><br>
                        ${umkm.Jenis}<br>
                        <img src="${umkm.Foto}" width="200"><br>
                        <a href="${umkm.Link}" target="_blank">Lihat Detail</a>
                    `);

                // Simpan data ke dalam array untuk dihitung jaraknya nanti
                daftarUMKM.push({
                    Nama: umkm.Nama,
                    Lat: lat,
                    Lon: lon,
                    marker: marker
                });
            }
        });
    }
});


// ==========================================
// FUNGSI-FUNGSI PENDUKUNG
// ==========================================

function cariTerdekat() {
    if (!navigator.geolocation) {
        alert("Browser Anda tidak mendukung fitur lokasi.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (pos) {
            const userLat = pos.coords.latitude;
            const userLon = pos.coords.longitude;

            daftarUMKM.forEach(function (umkm) {
                const latFloat = parseFloat(String(umkm.Lat).replace(',', '.'));
                const lonFloat = parseFloat(String(umkm.Lon).replace(',', '.'));

                // Menghitung jarak pengguna dengan tiap UMKM
                umkm.jarak = hitungJarak(userLat, userLon, latFloat, lonFloat);
            });

            // Urutkan dari yang paling dekat
            daftarUMKM.sort((a, b) => a.jarak - b.jarak);

            tampilkanDaftar();
        },
        function (error) {
            alert("Gagal mengambil lokasi: " + error.message);
        }
    );
}

function tampilkanDaftar() {
    let html = "<h3>UMKM Terdekat</h3>";
    console.log("Daftar terurut:", daftarUMKM);

    daftarUMKM.slice(0, 5).forEach(function (umkm) {
        html += `
        <div onclick="zoomUMKM('${umkm.Nama}')" style="cursor: pointer; padding: 5px; border-bottom: 1px solid #ccc;">
            ${umkm.Nama} 
            (${umkm.jarak.toFixed(2)} km)
        </div>
        `;
    });

    L.popup({
        maxWidth: 300
    })
    .setLatLng(map.getCenter())
    .setContent(html)
    .openOn(map);
}

function zoomUMKM(nama) {
    const umkm = daftarUMKM.find(x => x.Nama === nama);

    if (umkm) {
        const latFloat = parseFloat(String(umkm.Lat).replace(',', '.'));
        const lonFloat = parseFloat(String(umkm.Lon).replace(',', '.'));

        map.setView([latFloat, lonFloat], 18);

        if (umkm.marker) {
            umkm.marker.openPopup();
        }
    }
}

// WAJIB ADA: Rumus matematika untuk menghitung jarak di peta
function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius bumi dalam kilometer
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
}