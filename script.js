// Buat peta

let map = L.map('map').setView([-8.006657, 112.618495], 15);

// OpenStreetMap

L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// Icon Kuliner

let foodIcon = L.icon({
    iconUrl: 'Food.png',
    iconSize: [30,30]
});


// Ganti dengan link CSV Google Sheet Anda

const sheetUrl =
'https://docs.google.com/spreadsheets/d/e/2PACX-1vSnDFQuD4OIXm1Pt0qaDaBAWJXd1jYjIgIEnKaKmWnJt2LEwTqiwmWJXz6SoNqHGlnSQToM5H5yg7TA/pub?output=csv';


// Membaca Google Sheet

Papa.parse(sheetUrl, {

    download: true,

    header: true,

    complete: function(results) {

        console.log(results.data);

        results.data.forEach(function(umkm){

            if(umkm.Lat && umkm.Lon){

                L.marker(
                    [
                        parseFloat(umkm.Lat.replace(',', '.')),
                        parseFloat(umkm.Lon.replace(',', '.'))
                    ], {icon : foodIcon}
                )
                .addTo(map)
                .bindPopup(`
                    <b>${umkm.Nama}</b><br>
                    ${umkm.Jenis}<br>
                    <img src="${umkm.Foto}" width="200"><br>
                    <a href="${umkm.Link}" target="_blank">Lihat Detail</a>
                `);

            }

        });

    }

})
;
L.marker([-8.0070465, 112.6184146])
.addTo(map)
.bindPopup("Kantor Kel. Bandungrejosari")
.openPopup();

