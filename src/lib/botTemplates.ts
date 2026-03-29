// Dictionary sambatan dan pancingan receh untuk bot REHAT

export const botTemplates = {
  sambat: [
    "Bangun tidur jam 11 siang, emak udah nyap-nyap di dapur. Lempar nasib dulu lah biar nggak stres.",
    "Beli gorengan 5 rebu, pas diliat isinya angin semua. Gini amat nasib pengangguran.",
    "Tiap scroll IG isinya orang liburan ke luar negeri, giliran liat dompet isinya struk indomaret bulan kemaren.",
    "Lowongan kerja jaman sekarang: Pengalaman 5 tahun, umur max 22. Lu kira gue avatar bisa ngelewatin dimensi waktu?!",
    "Jadwal hari ini: Rebahan mikirin masa depan sampe ketiduran lagi.",
    "Temen udah pada nikah, gue baru mulai mikir gimana caranya instal ulang windows 10 pake flashdisk.",
    "Ngirim CV udah kayak sebar brosur kredit panci. Nggak dibaca, ditaruh doang di meja HRD.",
    "Baru niat mau produktif, eh hujan turun. Kata alam semesta: mending tidur lagi king.",
    "Kuotanya sisa 500MB, gajinya nyusul entah kapan. Fix puasa YouTube sebulan.",
    "Hari ini ada yang wawancara? Doain gue masuk tahap selanjutnya biar emak gue berhenti ngebandingin sama anak tetangga."
  ],
  curhat: [
    "Duh, paket belum dateng padahal udah cek resi 10 kali. Nasib lu gimana hari ini?",
    "Pernah nggak sih lu ditanya 'Kerja di mana sekarang?' di acara keluarga trus lu cuma bisa ketawa ngeles? Gimana cara jawabnya yak?",
    "Baru juga bangun tidur udah disuruh ke warung beli gas. Ada yang nasibnya sama?",
    "Kalian kalau lagi gabut nunggu panggilan kerja biasanya ngapain? Ngegame mulu juga bosen lama-lama...",
    "Jujur, lebih mending ditolak kerja karena skill atau di-ghosting HRD setelah interview 3 round? Gue lagi ngerasain yang kedua...",
    "Lulusan sarjana tapi tiap hari disuruh nyapu ngepel sama nyiram tanaman. Gapapa dapet pahala, tapi gengsi euy wkwk.",
    "Spill dong loker remote yang beneran ngasilin receh, lagi butuh banget buat beli kuota.",
    "Jam segini enaknya indomie kuah soto apa indomie goreng? Daripada mikirin karir mending mikir perut dulu.",
    "Coba tulis satu skill aneh yang lu punya tapi nggak berguna buat nyari kerja. Gue: bisa mainin pulpen di sela jari.",
    "Pagi! Info dong series Netflix atau anime yang worth it ditonton buat nemenin pagi hari yang nggak produktif ini."
  ]
};

export const getRandomTemplate = (type: 'sambat' | 'curhat') => {
  const list = botTemplates[type];
  return list[Math.floor(Math.random() * list.length)];
};
