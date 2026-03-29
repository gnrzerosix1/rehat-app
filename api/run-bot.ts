import { load } from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Pakai template yang baru kita bikin
// Supaya file ini bisa dijalanin mandiri di Vercel, kita masukin manual listnya
// karena Vercel API nggak sll gampang baca import dari src/lib kalau struktur outputnya beda.
const botTemplates = {
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

// Pindah init Supabase ke dalam handler biar ketahuan kalau ENV belum diset

// Username mapping
const botUsernames = {
  sambat: 'sipaling_sambat',
  curhat: 'pemancing_curhat',
  loker: 'sipalingupdate'
};

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase URL atau Key belum diset di Vercel Environment Variables!' });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { type } = req.query; // type: 'sambat', 'curhat', 'loker'
    if (!type || !['sambat', 'curhat', 'loker'].includes(type)) {
      return res.status(400).json({ error: 'Kasih type yang bener: sambat, curhat, loker' });
    }

    // 1. Dapatkan user_id dari bot
    const botUsername = botUsernames[type];
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', botUsername)
      .single();

    if (profileErr || !profileData) {
      return res.status(400).json({ 
        error: `Bot dengan username '${botUsername}' belum dibikin. Bikin dulu di app lu trus ganti aja usernamenya.` 
      });
    }

    const botUserId = profileData.id;
    let contentToPost = '';

    // 2. Tentukan Konten berdasarkan Tipe
    if (type === 'loker') {
      // Scrape data dari loker.id
      const response = await fetch('https://www.loker.id/terbaru', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const htmlString = await response.text();
      const $ = load(htmlString);
      
      // Ambil loker pertama (paling terbaru)
      const firstJob = $('.job-box').first();
      const jobTitle = firstJob.find('h3 a').text().trim();
      const jobLink = firstJob.find('h3 a').attr('href');
      const company = firstJob.find('.job-company').text().trim();
      const location = firstJob.find('.job-location').text().trim();

      if (!jobTitle) {
        throw new Error('Gagal scrape loker. Struktur HTML mungkin berubah.');
      }

      contentToPost = `✨ LOKER TERBARU HARI INI ✨\n\nPosisi: ${jobTitle}\nPerusahaan: ${company}\nLokasi: ${location}\n\nLangsung aja ngacir apply di mari: ${jobLink}\n\nYok yang masih ngerem di kosan, semangat! 💪`;
    } else {
      // Ambil template random buat sambat/curhat
      const list = botTemplates[type];
      contentToPost = list[Math.floor(Math.random() * list.length)];
    }

    // 3. Posting otomatis ke tabel posts
    const { error: insertErr } = await supabase.from('posts').insert([
      { content: contentToPost, user_id: botUserId }
    ]);

    if (insertErr) {
      throw insertErr;
    }

    return res.status(200).json({ 
      success: true, 
      bot: botUsername,
      type: type,
      content: contentToPost 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
