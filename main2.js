// // import { GoogleGenerativeAI, HarmBlockTreshold, HarmCategory } from "@google";
// import Base64 from 'base64-js';
// import MarkdownIt from 'markdown-it';

//AI Groq

// import OpenAI from "openai";
// const GEMINI_API_KEY = new OpenAI({
//     apiKey: "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",
//     // baseURL: "https://api.groq.com/openai/v1",
// });

// const response = await client.responses.create({
//     model: "openai/gpt-oss-20b",
//     input: "Explain the importance of fast language models",
// });
// console.log(response.output_text);


//const GEMINI_API_KEY = "AQ.Ab8RN6L-WKXdpUPM54V5LZsZc37kJHPHkk8O-zprpqOC2b3WJg";
// const GEMINI_API_KEY = "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";

let materiData = {};
let soalKuis = [];

// Muat data JSON saat pertama kali membuka halaman
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    materiData = data.materiData;
    soalKuis = data.soalKuis;
    muatSoal();
  } catch (error) {
    console.error("Gagal memuat data.json:", error);
  }
});

// ===== MODAL =====
function bukaModal(id) {
  const data = materiData[id];
  if (!data) return;
  document.getElementById('modalJudul').textContent = data.judul;
  document.getElementById('modalSub').textContent = data.sub;
  document.getElementById('modalKonten').innerHTML = data.konten;
  document.getElementById('modalOverlay').classList.add('aktif');
  document.body.style.overflow = 'hidden';
}

function tutupModal() {
  document.getElementById('modalOverlay').classList.remove('aktif');
  document.body.style.overflow = '';
}

// ===== AI CHAT =====
function tambahPesan(teks, pengirim) {
  const area = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `pesan pesan-${pengirim}`;
  div.innerHTML = `
    <div class="pesan-avatar">${pengirim === 'ai' ? '🤖' : '👤'}</div>
    <div class="gelembung">${teks}</div>
  `;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function tambahTyping() {
  const area = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'pesan pesan-ai';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="pesan-avatar">🤖</div>
    <div class="mengetik"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
  `;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
  return 'typingIndicator';
}

function hapusTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function saranKlik(btn) {
  document.getElementById('chatInput').value = btn.textContent;
  kirimPesan();
}

async function kirimPesan() {
  const input = document.getElementById('chatInput');
  const teks = input.value.trim();
  if (!teks) return;

  tambahPesan(teks, 'user');
  input.value = '';

  const typingId = tambahTyping();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Kamu adalah BahasaAI, asisten edukasi Bahasa Indonesia yang ramah, sabar, dan kreatif. 
Tugasmu membantu siswa belajar Bahasa Indonesia: menjelaskan materi, memberikan contoh, 
mengoreksi tulisan, membuat pantun/puisi, dll.
Jawab dalam Bahasa Indonesia yang baku tapi tetap santai dan mudah dipahami.
Gunakan emoji secukupnya agar lebih menarik. Jawaban singkat dan langsung ke poin.

Pertanyaan user: ${teks}`
          }]
        }]
      })
    });

    hapusTyping(typingId);

    if (!resp.ok) {
      throw new Error('Gagal memanggil Gemini API');
    }

    const data = await resp.json();
    const balasan = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, ada kesalahan dalam memproses jawaban.';
    tambahPesan(balasan, 'ai');
  } catch (e) {
    hapusTyping(typingId);
    console.error(e);
    tambahPesan('Maaf, koneksi bermasalah atau API Key tidak valid. Pastikan kembali konfigurasi Anda ya! 🙏', 'ai');
  }
}

// ===== KUIS =====
let soalSaatIni = 0;
let nilaiBenar = 0;
let sudahDijawab = false;

function muatSoal() {
  if (soalKuis.length === 0) return;

  if (soalSaatIni >= soalKuis.length) {
    tampilHasil();
    return;
  }

  const soal = soalKuis[soalSaatIni];
  sudahDijawab = false;

  document.getElementById('progressBar').style.width = ((soalSaatIni / soalKuis.length) * 100) + '%';
  document.getElementById('soalNomor').textContent = `Soal ${soalSaatIni + 1} dari ${soalKuis.length}`;
  document.getElementById('soalPertanyaan').textContent = soal.pertanyaan;
  document.getElementById('umpanBalik').className = 'umpan-balik';
  document.getElementById('btnLanjut').className = 'btn-lanjut';

  const pilihanList = document.getElementById('pilihanList');
  pilihanList.innerHTML = '';
  const huruf = ['A', 'B', 'C', 'D'];

  soal.pilihan.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'pilihan-btn';
    btn.innerHTML = `<span class="pilihan-indeks">${huruf[i]}</span> ${p}`;
    btn.onclick = () => pilihJawaban(i, btn);
    pilihanList.appendChild(btn);
  });
}

function pilihJawaban(idx, btn) {
  if (sudahDijawab) return;
  sudahDijawab = true;

  const soal = soalKuis[soalSaatIni];
  const tombol = document.querySelectorAll('.pilihan-btn');
  tombol.forEach(b => b.disabled = true);

  const umpan = document.getElementById('umpanBalik');

  if (idx === soal.benar) {
    nilaiBenar++;
    btn.classList.add('benar');
    umpan.className = 'umpan-balik tampil benar';
    umpan.innerHTML = `✅ <strong>Benar!</strong> ${soal.penjelasan}`;
  } else {
    btn.classList.add('salah');
    tombol[soal.benar].classList.add('benar');
    umpan.className = 'umpan-balik tampil salah';
    umpan.innerHTML = `❌ <strong>Kurang tepat.</strong> ${soal.penjelasan}`;
  }

  document.getElementById('skorInfo').textContent = `Skor: ${nilaiBenar} / ${soalSaatIni + 1}`;
  document.getElementById('btnLanjut').className = 'btn-lanjut tampil';
}

function soalBerikutnya() {
  soalSaatIni++;
  muatSoal();
}

function tampilHasil() {
  const persen = Math.round((nilaiBenar / soalKuis.length) * 100);
  let emoji = persen >= 80 ? '🏆' : persen >= 60 ? '👍' : '📚';
  let pesan = persen >= 80 ? 'Luar biasa! Kamu sangat menguasai materi ini.' :
              persen >= 60 ? 'Bagus! Masih ada ruang untuk berkembang.' :
              'Jangan menyerah! Ulangi materi dan coba lagi.';

  document.getElementById('quizBox').innerHTML = `
    <div style="text-align:center;padding:2rem 1rem">
      <div style="font-size:3.5rem;margin-bottom:1rem">${emoji}</div>
      <h3 style="font-family:'Playfair Display',serif;font-size:1.8rem;margin-bottom:0.5rem">Hasil Latihan</h3>
      <div style="font-size:3rem;font-weight:700;color:var(--hijau-muda);margin:1rem 0">${persen}%</div>
      <p style="color:var(--teks-sekunder);margin-bottom:0.5rem">${nilaiBenar} dari ${soalKuis.length} soal benar</p>
      <p style="color:var(--teks-sekunder);font-size:0.9rem;margin-bottom:2rem">${pesan}</p>
      <button onclick="resetKuis()" style="background:var(--hijau-muda);color:#fff;border:none;padding:12px 28px;border-radius:100px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">Ulangi Latihan</button>
    </div>
  `;
}

function resetKuis() {
  soalSaatIni = 0;
  nilaiBenar = 0;
  sudahDijawab = false;

  document.getElementById('quizBox').innerHTML = `
    <div class="progress-bar"><div class="progress-isi" id="progressBar" style="width:10%"></div></div>
    <div class="soal-nomor" id="soalNomor"></div>
    <div class="soal-pertanyaan" id="soalPertanyaan"></div>
    <div class="pilihan-list" id="pilihanList"></div>
    <div class="umpan-balik" id="umpanBalik"></div>
    <div class="quiz-nav">
      <div class="skor-info" id="skorInfo">Skor: 0 / 0</div>
      <button class="btn-lanjut" id="btnLanjut" onclick="soalBerikutnya()">Lanjut →</button>
    </div>
  `;
  muatSoal();
}

// ===== SCROLL REVEAL =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ===== NAVBAR =====
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 80) nav.classList.add('visible');
  else nav.classList.remove('visible');
});