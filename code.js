
// ======================================================
// ANGKASA SMART SCHOOL
// MASTER DATA SISWA, GURU & KARYAWAN
// PENCARIAN DAN INTEGRASI ABSENSI DIGITAL
// ======================================================


// ======================================================
// URL GOOGLE APPS SCRIPT DAN APLIKASI ABSENSI
// ======================================================

// URL Web App Google Apps Script
const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbyAB4SjQRj-0X0n1L32rvHxTYfxeEPcgVrmUJhc-XzI082gcXRVG88imzBKFa3ST_uq/exec";

// URL aplikasi absensi digital
const URL_ABSENSI =
  "https://absensidigitalsmphsn.netlify.app/";


// ======================================================
// PENYIMPANAN SEMENTARA DATA
// ======================================================

let dataSiswa = [];
let dataPegawai = [];

let kataCariSiswaAktif = "";
let kataCariPegawaiAktif = "";


// ======================================================
// FUNGSI UMUM
// ======================================================

function teksAman(nilai) {
  return String(nilai == null || nilai === "" ? "-" : nilai)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function ambilKelasSiswa(siswa) {
  const kunci = Object.keys(siswa || {});

  const normal = kunci.map(k => ({
    asli: k,
    norm: k.toUpperCase().replace(/[^A-Z0-9]/g, "")
  }));

  const prioritas = [
    "KELASSAATINI",
    "KELASTERKINI",
    "KELASSEKARANG",
    "KELASBARU",
    "KELAS"
  ];

  for (const p of prioritas) {
    const cocok = normal.find(x => x.norm === p);

    if (
      cocok &&
      siswa[cocok.asli] != null &&
      String(siswa[cocok.asli]).trim() !== ""
    ) {
      return siswa[cocok.asli];
    }
  }

  const kandidat = normal.find(x =>
    x.norm.includes("KELAS") &&
    siswa[x.asli] != null &&
    String(siswa[x.asli]).trim() !== ""
  );

  return kandidat ? siswa[kandidat.asli] : "-";
}


function buatBarisKosong(tbody, jumlahKolom, pesan) {
  tbody.innerHTML = "";

  const tr = document.createElement("tr");
  const td = document.createElement("td");

  td.colSpan = jumlahKolom;

  td.style.cssText =
    "text-align:center;padding:24px;color:#64748b;";

  td.textContent = pesan;

  tr.appendChild(td);
  tbody.appendChild(tr);
}


// ======================================================
// MASTER DATA SISWA
// ======================================================

function renderTabelSiswa() {
  const tbody = document.getElementById("tabelSiswaBody");

  if (!tbody) return;

  const kata = kataCariSiswaAktif
    .trim()
    .toLocaleLowerCase("id-ID");

  const hasil = dataSiswa.filter(siswa => {
    const nama = String(siswa.NAMA_LENGKAP || "")
      .toLocaleLowerCase("id-ID");

    const nis = String(siswa.NIS || "")
      .toLocaleLowerCase("id-ID");

    const kelas = String(ambilKelasSiswa(siswa) || "")
      .toLocaleLowerCase("id-ID");

    return (
      !kata ||
      nama.includes(kata) ||
      nis.includes(kata) ||
      kelas.includes(kata)
    );
  });

  if (!hasil.length) {
    buatBarisKosong(
      tbody,
      9,
      dataSiswa.length
        ? "Tidak ada siswa yang cocok dengan pencarian."
        : "Belum ada data siswa."
    );

  } else {
    tbody.innerHTML = "";

    hasil.forEach((siswa, index) => {
      const tglLahir = siswa.TANGGAL_LAHIR
        ? new Date(siswa.TANGGAL_LAHIR).toLocaleDateString(
            "id-ID",
            {
              day: "numeric",
              month: "short",
              year: "numeric"
            }
          )
        : "-";

      const tr = document.createElement("tr");

      tr.style.cssText =
        "border-bottom:1px solid #f3f4f6;font-size:13px;";

      const isi = [
        `<input type="checkbox" aria-label="Pilih ${teksAman(siswa.NAMA_LENGKAP || "siswa")}">`,
        String(index + 1),
        `<div style="width:32px;height:32px;background:#4f46f5;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;">${teksAman(String(siswa.NAMA_LENGKAP || "S").substring(0, 2).toUpperCase())}</div>`,
        `<strong>${teksAman(siswa.NAMA_LENGKAP)}</strong><br><small style="color:#6b7280;">NISN: ${teksAman(siswa.NISN)}</small>`,
        teksAman(siswa.NIS),
        teksAman(ambilKelasSiswa(siswa)),
        teksAman(siswa.JENIS_KELAMIN),
        `${teksAman(siswa.TEMPAT_LAHIR || "")}, ${teksAman(tglLahir)}`,
        `<span style="background:#d1fae5;color:#065f46;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:500;">${teksAman(siswa.STATUS_SISWA || "Aktif")}</span>`
      ];

      isi.forEach((konten, i) => {
        const td = document.createElement("td");

        td.style.padding = "12px";

        if ([0, 2, 3, 8].includes(i)) {
          td.innerHTML = konten;
        } else {
          td.textContent = konten;
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  const info = document.getElementById("infoCariSiswa");

  if (info) {
    info.textContent =
      `Menampilkan ${hasil.length} dari ${dataSiswa.length} siswa.`;
  }

  const stat = document.getElementById("statTotalSiswa");

  if (stat) {
    stat.textContent = String(dataSiswa.length);
  }
}


function ambilDataSiswa() {
  const tbody = document.getElementById("tabelSiswaBody");

  if (!tbody) return;

  buatBarisKosong(
    tbody,
    9,
    "⏳ Sedang mengambil data dari Google Sheets..."
  );

  fetch(GOOGLE_SHEET_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      return response.json();
    })
    .then(result => {
      dataSiswa = Array.isArray(result)
        ? result
        : (Array.isArray(result.data) ? result.data : []);

      kataCariSiswaAktif = "";

      const input = document.getElementById("cariSiswa");

      if (input) input.value = "";

      renderTabelSiswa();
    })
    .catch(error => {
      console.error("Gagal memuat data siswa:", error);

      buatBarisKosong(
        tbody,
        9,
        "Gagal memuat data siswa dari Google Sheets. Periksa koneksi dan Apps Script."
      );
    });
}


// ======================================================
// MASTER DATA GURU DAN KARYAWAN
// ======================================================

const PEGAWAI_FIELDS = [
  "ID_PEGAWAI",
  "NAMA_LENGKAP",
  "NIP",
  "NUPTK",
  "JENIS_KELAMIN",
  "JABATAN",
  "STATUS_KEPEGAWAIAN",
  "MATA_PELAJARAN",
  "NO_HP",
  "EMAIL",
  "STATUS_AKTIF",
  "KETERANGAN"
];


function renderTabelPegawai() {
  const tbody = document.getElementById("tabelPegawaiBody");

  if (!tbody) return;

  const kata = kataCariPegawaiAktif
    .trim()
    .toLocaleLowerCase("id-ID");

  const kolomCari = [
    "NAMA_LENGKAP",
    "ID_PEGAWAI",
    "NIP",
    "NUPTK",
    "JABATAN"
  ];

  const hasil = dataPegawai.filter(p =>
    !kata ||
    kolomCari.some(field =>
      String(p[field] || "")
        .toLocaleLowerCase("id-ID")
        .includes(kata)
    )
  );

  if (!hasil.length) {
    buatBarisKosong(
      tbody,
      14,
      dataPegawai.length
        ? "Tidak ada pegawai yang cocok dengan pencarian."
        : "Belum ada data pegawai."
    );

  } else {
    tbody.innerHTML = "";

    hasil.forEach((pegawai, index) => {
      const tr = document.createElement("tr");

      tr.style.cssText =
        "border-bottom:1px solid #f3f4f6;font-size:13px;";

      const pilih = document.createElement("td");

      pilih.style.padding = "12px";

      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";

      checkbox.setAttribute(
        "aria-label",
        "Pilih " + (pegawai.NAMA_LENGKAP || "pegawai")
      );

      pilih.appendChild(checkbox);
      tr.appendChild(pilih);

      const no = document.createElement("td");

      no.style.padding = "12px";
      no.textContent = String(index + 1);

      tr.appendChild(no);

      PEGAWAI_FIELDS.forEach(field => {
        const td = document.createElement("td");

        td.style.padding = "12px";

        const value =
          pegawai[field] == null || pegawai[field] === ""
            ? "-"
            : String(pegawai[field]);

        if (field === "NAMA_LENGKAP") {
          const strong = document.createElement("strong");

          strong.textContent = value;

          td.appendChild(strong);

        } else if (
          field === "STATUS_AKTIF" &&
          String(pegawai[field] || "").toLowerCase() === "aktif"
        ) {
          const badge = document.createElement("span");

          badge.textContent = value;

          badge.style.cssText =
            "background:#d1fae5;color:#065f46;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:500;";

          td.appendChild(badge);

        } else {
          td.textContent = value;
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  const info = document.getElementById("infoCariPegawai");

  if (info) {
    info.textContent =
      `Menampilkan ${hasil.length} dari ${dataPegawai.length} pegawai.`;
  }

  const stat = document.getElementById("statTotalPegawai");

  if (stat) {
    stat.textContent = String(dataPegawai.length);
  }
}


function ambilDataPegawai() {
  const tbody = document.getElementById("tabelPegawaiBody");

  if (!tbody) return;

  buatBarisKosong(
    tbody,
    14,
    "⏳ Sedang mengambil data pegawai..."
  );

  fetch(GOOGLE_SHEET_URL + "?sheet=PEGAWAI")
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      return response.json();
    })
    .then(result => {
      if (result && result.status === "error") {
        throw new Error(
          result.message || "API mengembalikan kesalahan."
        );
      }

      dataPegawai = Array.isArray(result)
        ? result
        : (Array.isArray(result.data) ? result.data : []);

      kataCariPegawaiAktif = "";

      const input = document.getElementById("cariPegawai");

      if (input) input.value = "";

      renderTabelPegawai();
    })
    .catch(error => {
      console.error("Gagal memuat data pegawai:", error);

      buatBarisKosong(
        tbody,
        14,
        "Gagal memuat data PEGAWAI. Periksa dukungan parameter sheet=PEGAWAI pada Google Apps Script."
      );
    });
}


// ======================================================
// INTEGRASI ABSENSI DIGITAL
// ======================================================

function bukaHalamanAbsensi(jenis) {

  // ID disesuaikan dengan index.html
  const halaman =
    document.getElementById("page-absensi-tersemat");

  const iframe =
    document.getElementById("iframeAbsensiDigital");

  const judul =
    document.getElementById("judulAbsensiTersemat");

  const petunjuk =
    document.getElementById("petunjukAbsensiTersemat");

  const status =
    document.getElementById("statusAbsensiIframe");


  // Periksa keberadaan elemen HTML.
  if (!halaman || !iframe) {
    console.error(
      "Elemen iframe absensi tidak ditemukan. Periksa ID di index.html."
    );
    return;
  }


  // Tampilkan halaman absensi.
  halaman.style.display = "block";


  // Atur judul dan petunjuk.
  if (jenis === "siswa") {

    if (judul) {
      judul.textContent = "Absensi Siswa";
    }

    if (petunjuk) {
      petunjuk.textContent =
        "Pada aplikasi absensi di bawah, pilih SISWA untuk melakukan absensi siswa.";
    }

  } else {

    if (judul) {
      judul.textContent = "Absensi Pegawai";
    }

    if (petunjuk) {
      petunjuk.textContent =
        "Pada aplikasi absensi di bawah, pilih GURU / STAFF untuk melakukan absensi pegawai.";
    }

  }


  // Pasang pemantauan proses pemuatan iframe.
  iframe.onload = function () {
    if (status) {
      status.textContent =
        "Aplikasi absensi berhasil dimuat.";
    }
  };

  iframe.onerror = function () {
    if (status) {
      status.textContent =
        "Aplikasi absensi gagal dimuat. Periksa koneksi internet.";
    }
  };


  // Muat aplikasi hanya jika belum pernah dimuat.
  if (!iframe.getAttribute("src")) {

    const alamat =
      iframe.getAttribute("data-src") || URL_ABSENSI;

    if (status) {
      status.textContent =
        "Sedang memuat aplikasi absensi...";
    }

    iframe.src = alamat;

  } else {

    if (status) {
      status.textContent =
        "Aplikasi absensi siap digunakan.";
    }

  }

}


// ======================================================
// NAVIGASI DAN PENCARIAN
// ======================================================

document.addEventListener("DOMContentLoaded", function() {


  // ----------------------------------------------------
  // NAVIGASI MENU UTAMA
  // ----------------------------------------------------

  const navLinks = document.querySelectorAll(
    ".main-nav button[data-page]"
  );

  navLinks.forEach(button => {

    button.addEventListener("click", function() {

      const targetPage =
        this.getAttribute("data-page");


      // Elemen halaman utama.
      const dashboardContent =
        document.querySelector(".page-content");

      const siswaView =
        document.getElementById("page-master-siswa");

      const pegawaiView =
        document.getElementById("page-master-guru-karyawan");

      // ID disesuaikan dengan index.html.
      const absensiView =
        document.getElementById("page-absensi-tersemat");


      // Sembunyikan seluruh halaman khusus terlebih dahulu.
      if (dashboardContent) {
        dashboardContent.style.display = "none";
      }

      if (siswaView) {
        siswaView.style.display = "none";
      }

      if (pegawaiView) {
        pegawaiView.style.display = "none";
      }

      if (absensiView) {
        absensiView.style.display = "none";
      }


      // Elemen breadcrumb.
      const breadcrumb =
        document.getElementById("breadcrumbCurrent");


      // ------------------------------------------------
      // MENU MASTER SISWA
      // ------------------------------------------------

      if (targetPage === "master-siswa") {

        if (siswaView) {
          siswaView.style.display = "block";
        }

        if (breadcrumb) {
          breadcrumb.innerText = "Siswa";
        }

        ambilDataSiswa();


      // ------------------------------------------------
      // MENU MASTER GURU DAN KARYAWAN
      // ------------------------------------------------

      } else if (targetPage === "master-guru-karyawan") {

        if (pegawaiView) {
          pegawaiView.style.display = "block";
        }

        if (breadcrumb) {
          breadcrumb.innerText = "Guru & Karyawan";
        }

        ambilDataPegawai();


      // ------------------------------------------------
      // MENU ABSENSI SISWA
      // ------------------------------------------------

      } else if (targetPage === "absensi-siswa") {

        bukaHalamanAbsensi("siswa");

        if (breadcrumb) {
          breadcrumb.innerText = "Absensi Siswa";
        }


      // ------------------------------------------------
      // MENU ABSENSI PEGAWAI
      // ------------------------------------------------

      } else if (targetPage === "absensi-pegawai") {

        bukaHalamanAbsensi("pegawai");

        if (breadcrumb) {
          breadcrumb.innerText = "Absensi Pegawai";
        }


      // ------------------------------------------------
      // MENU DASHBOARD
      // ------------------------------------------------

      } else if (targetPage === "dashboard") {

        if (dashboardContent) {
          dashboardContent.style.display = "block";
        }

        if (breadcrumb) {
          breadcrumb.innerText = "Dashboard";
        }

      }

    });

  });


  // ----------------------------------------------------
  // PENCARIAN SISWA
  // ----------------------------------------------------

  function jalankanCariSiswa() {

    kataCariSiswaAktif =
      document.getElementById("cariSiswa")?.value || "";

    renderTabelSiswa();

  }


  // ----------------------------------------------------
  // PENCARIAN PEGAWAI
  // ----------------------------------------------------

  function jalankanCariPegawai() {

    kataCariPegawaiAktif =
      document.getElementById("cariPegawai")?.value || "";

    renderTabelPegawai();

  }


  // ----------------------------------------------------
  // TOMBOL CARI SISWA
  // ----------------------------------------------------

  document
    .getElementById("btnCariSiswa")
    ?.addEventListener("click", jalankanCariSiswa);


  document
    .getElementById("cariSiswa")
    ?.addEventListener("keydown", event => {

      if (event.key === "Enter") {
        jalankanCariSiswa();
      }

    });


  // ----------------------------------------------------
  // TOMBOL CARI PEGAWAI
  // ----------------------------------------------------

  document
    .getElementById("btnCariPegawai")
    ?.addEventListener("click", jalankanCariPegawai);


  document
    .getElementById("cariPegawai")
    ?.addEventListener("keydown", event => {

      if (event.key === "Enter") {
        jalankanCariPegawai();
      }

    });


});


/* =====================================================
   INTEGRASI MENU SUPERVISI GTK DARI GITHUB
   ANGKASA SMART SCHOOL
===================================================== */

document.addEventListener("click", function(event) {
  const menu = event.target.closest(
    '.main-nav button[data-page="supervisi"]'
  );

  if (!menu) return;

  // Sembunyikan konten halaman utama
  const pageContent = document.querySelector(".page-content");
  if (pageContent) pageContent.style.display = "none";

  // Sembunyikan halaman-halaman internal lainnya
  document.querySelectorAll(
    '.main-area > section[id^="page-"]'
  ).forEach(function(section) {
    section.style.display = "none";
  });

  // Tampilkan halaman Supervisi GTK
  const halaman = document.getElementById(
    "page-supervisi-tersemat"
  );

  if (halaman) halaman.style.display = "block";

  // Perbarui breadcrumb
  const breadcrumb = document.getElementById(
    "breadcrumbCurrent"
  );

  if (breadcrumb) breadcrumb.textContent = "Supervisi GTK";

  // Muat aplikasi GitHub saat pertama kali dibuka
  const iframe = document.getElementById("iframeSupervisiGTK");

  if (iframe && !iframe.src) {
    iframe.src = iframe.dataset.src;
  }

  // Status pemuatan iframe
  if (iframe) {
    iframe.onload = function() {
      const status = document.getElementById(
        "statusSupervisiIframe"
      );

      if (status) status.style.display = "none";
    };
  }
});
