/* =====================================================================
   SZALONE AUTO – strona + panel administracyjny (CMS) w jednym pliku
   ---------------------------------------------------------------------
   WERSJA DEMONSTRACYJNA / PORTFOLIO:
   - wszystkie treści są w obiekcie STATE (wartości początkowe poniżej),
   - zmiany z panelu zapisują się WYŁĄCZNIE w przeglądarce osoby edytującej
     (IndexedDB, awaryjnie localStorage) – inni odwiedzający ich nie widzą,
   - dane logowania NIE są zapisane w kodzie jawnie – przechowywany jest
     tylko skrót SHA-256 (CMS_SKROT). Sprawdzanie odbywa się w przeglądarce,
     więc to wciąż nie jest zabezpieczenie produkcyjne.
   Wersja produkcyjna: zapis danych na serwerze (np. Cloudflare Workers + KV)
   i prawdziwe logowanie.
   Kolejność kodu: 1) dane początkowe, 2) renderowanie strony, 3) panel.
   ===================================================================== */
"use strict";

/* Skrót SHA-256 z: "szalone-auto-cms|" + login + "|" + hasło.
   Zmiana danych logowania: wygeneruj nowy skrót, np. w konsoli przeglądarki:
   sha256("szalone-auto-cms|LOGIN|HASLO") i wklej go poniżej. */
var CMS_SKROT = "a229ec0f5a7b794174bea7165be9fa2ef6bb783d05235ae58f056c3c5b0af602";
/* SHA-256 w czystym JS (działa także bez HTTPS) */
function sha256(tekst) {
  var b = unescape(encodeURIComponent(tekst)), i, j, K = [], H0 = [], p = 2, n = 0;
  function frac(x) { return (x - Math.floor(x)) * 4294967296 | 0; }
  while (n < 64) { for (j = 2; j * j <= p; j++) if (p % j === 0) break; if (j * j > p) { if (n < 8) H0[n] = frac(Math.pow(p, 1 / 2)); K[n++] = frac(Math.pow(p, 1 / 3)); } p++; }
  var w = [], l = b.length * 8; b += "\x80"; while (b.length % 64 !== 56) b += "\x00";
  for (i = 0; i < b.length; i++) w[i >> 2] |= b.charCodeAt(i) << (24 - (i % 4) * 8);
  w[w.length] = (l / 4294967296) | 0; w[w.length] = l | 0;
  var h = H0.slice(), r = function (x, s) { return (x >>> s) | (x << (32 - s)); };
  for (i = 0; i < w.length; i += 16) {
    var W = w.slice(i, i + 16), a = h.slice();
    for (j = 0; j < 64; j++) {
      if (j >= 16) { var s0 = r(W[j - 15], 7) ^ r(W[j - 15], 18) ^ (W[j - 15] >>> 3), s1 = r(W[j - 2], 17) ^ r(W[j - 2], 19) ^ (W[j - 2] >>> 10); W[j] = (W[j - 16] + s0 + W[j - 7] + s1) | 0; }
      var t1 = (a[7] + (r(a[4], 6) ^ r(a[4], 11) ^ r(a[4], 25)) + ((a[4] & a[5]) ^ (~a[4] & a[6])) + K[j] + W[j]) | 0;
      var t2 = ((r(a[0], 2) ^ r(a[0], 13) ^ r(a[0], 22)) + ((a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]))) | 0;
      a = [(t1 + t2) | 0, a[0], a[1], a[2], (a[3] + t1) | 0, a[4], a[5], a[6]];
    }
    for (j = 0; j < 8; j++) h[j] = (h[j] + a[j]) | 0;
  }
  return h.map(function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
}
var APP_ID = "szalone-auto-cms";
var APP_WERSJA = 1;

/* ---------- daty ---------- */
function dzisISO(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function zISO(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function dodajDni(iso, n) { var d = zISO(iso); d.setDate(d.getDate() + n); return dzisISO(d); }
var MIESIACE_D = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
var MIESIACE_K = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
var DNI = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
var DNI_W = ["w poniedziałek", "we wtorek", "w środę", "w czwartek", "w piątek", "w sobotę", "w niedzielę"];
function dataSlownie(iso) { if (!iso) return ""; var d = zISO(iso); return d.getDate() + " " + MIESIACE_D[d.getMonth()] + " " + d.getFullYear(); }
function dataKrotko(iso) { var d = zISO(iso); return d.getDate() + "." + String(d.getMonth() + 1).padStart(2, "0"); }
function uid() { return Math.random().toString(36).slice(2, 9); }

/* ---------- ikony (liniowe 24 px, grubość jak linia w logo) ---------- */
var IKONY = {
  tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  sms: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  zegar: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  tarcza: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6z"/><path d="m8.8 12 2.3 2.3 4.3-4.6"/>',
  faktura: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
  karta: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
  olej: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  piorun: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  sniezka: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
  kolo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21"/>',
  geometria: '<path d="M7 4 5 20M19 4l-2 16"/><path d="M3 12h18" stroke-dasharray="2 2.5"/>',
  karoseria: '<path d="M3 15v-3l2.5-5h9L18 11l3 1v3"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/><path d="M9 16h6"/>',
  lpg: '<rect x="4" y="8" width="16" height="10" rx="5"/><path d="M12 8V5M10 5h4"/>',
  szyba: '<path d="M4 17 6 7h12l2 10z"/><path d="m9 14 4-4M12 15l3-3"/>',
  hamulec: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M17 5.5a9 9 0 0 1 2.5 6.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  strzalka: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  fb: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8z"/>',
  ig: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r=".6"/>',
  parking: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3"/>',
  gwiazda: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  klodka: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  dostep: '<circle cx="12" cy="5" r="2"/><path d="M5 9h14M12 9v6m0 0-3 6m3-6 3 6"/>',
  megafon: '<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
  kalendarz: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'
};
function ico(n, cls) { return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (IKONY[n] || IKONY.check) + "</svg>"; }
var IKONY_USLUG = [["olej", "Kropla (płyny)"], ["check", "Haczyk (mechanika)"], ["hamulec", "Tarcza hamulcowa"], ["lpg", "Butla LPG"], ["chip", "Układ scalony (diagnostyka)"], ["piorun", "Piorun (elektryka)"], ["sniezka", "Śnieżka (klimatyzacja)"], ["kolo", "Koło"], ["geometria", "Geometria"], ["karoseria", "Nadwozie"], ["szyba", "Szyba"], ["tarcza", "Tarcza (gwarancja)"], ["faktura", "Dokument"], ["karta", "Karta płatnicza"], ["zegar", "Zegar"], ["parking", "Parking"]];

/* ---------- grafiki techniczne (wbudowane zamiast zdjęć, wartość "bp:nazwa") ---------- */
var GRAFIKI = { auto: "Auto – rysunek techniczny", diagnoza: "Diagnostyka – sygnał", kolo: "Geometria kół", klima: "Klimatyzacja – obieg powietrza", hamulce: "Układ hamulcowy", warsztat: "Auto na podnośniku" };
function bpAuto(dx, dy, s, rys) {
  var r = rys ? ' pathLength="1"' : "";
  var c = rys ? "l rys" : "l";
  return '<g transform="translate(' + dx + " " + dy + ") scale(" + s + ')">' +
    '<path class="' + c + '"' + r + ' d="M120 470L112 430Q110 400 140 392L215 382Q265 318 330 300L470 298Q520 300 565 340L610 378L690 392Q720 398 722 425L718 470H652A62 62 0 0 0 528 470H292A62 62 0 0 0 168 470Z"/>' +
    '<path class="' + c + '"' + r + ' d="M238 382Q280 330 335 316L395 314V382Z"/>' +
    '<path class="' + c + '"' + r + ' d="M410 314H465Q505 318 545 358L555 382H410Z"/>' +
    '<path class="l2" d="M402 388V462M350 404h22M452 404h22M692 404l20 5M118 408l14 2"/>' +
    '<g class="obrot"><circle class="' + c + '"' + r + ' cx="230" cy="470" r="50"/><circle class="l2" cx="230" cy="470" r="22"/><path class="l2" d="M230 448v-20M230 492v20M208 470h-20M252 470h20"/></g>' +
    '<g class="obrot"><circle class="' + c + '"' + r + ' cx="590" cy="470" r="50"/><circle class="l2" cx="590" cy="470" r="22"/><path class="l2" d="M590 448v-20M590 492v20M568 470h-20M612 470h20"/></g></g>';
}
function grafika(nazwa, klasa) {
  var siatka = "";
  for (var x = 40; x < 800; x += 40) siatka += "M" + x + " 0V680";
  for (var y = 40; y < 680; y += 40) siatka += "M0 " + y + "H800";
  var w = '<svg class="bp ' + (klasa || "") + '" viewBox="0 0 800 680" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + (GRAFIKI[nazwa] || "Grafika") + '"><rect width="800" height="680" fill="#191C22"/><path class="siatka" d="' + siatka + '"/>';
  var t = "";
  if (nazwa === "auto") {
    t = bpAuto(0, 0, 1, true) +
      '<path class="wym" d="M60 530H740M168 590H652M168 580v20M652 580v20M300 250H560M300 240v20M560 240v20"/>' +
      '<text x="410" y="620" text-anchor="middle">ROZSTAW OSI</text><text x="430" y="232" text-anchor="middle">DACH</text>' +
      '<text x="40" y="60">RYS. 01 · KONTROLA OGÓLNA</text><text x="760" y="60" text-anchor="end">SZALONE AUTO</text>';
  } else if (nazwa === "diagnoza") {
    var p = "M60 360";
    for (var i = 0; i <= 680; i += 8) { var v = Math.sin(i / 28) * 46 + Math.sin(i / 9) * 14 * (i % 160 < 40 ? 1 : .2); p += "L" + (60 + i) + " " + (360 - v).toFixed(1); }
    t = '<path class="wym" d="M60 250H740M60 470H740M60 360H740" stroke-dasharray="4 6"/>' +
      '<path class="l rys" pathLength="1" d="' + p + '"/>' +
      '<g class="skan" style="--skan:600px"><path class="hl" d="M80 230V490" opacity=".7"/><circle cx="80" cy="360" r="6" fill="#C9A35B"/></g>' +
      '<path class="l rys" pathLength="1" d="M300 540H500L486 610H314Z"/>' +
      '<g fill="#6E7480"><circle cx="340" cy="562" r="5"/><circle cx="370" cy="562" r="5"/><circle cx="400" cy="562" r="5"/><circle cx="430" cy="562" r="5"/><circle cx="460" cy="562" r="5"/><circle cx="355" cy="588" r="5"/><circle cx="415" cy="588" r="5"/><circle cx="445" cy="588" r="5"/></g><circle class="migaj" cx="385" cy="588" r="6" fill="#C9A35B"/>' +
      '<text x="40" y="60">RYS. 02 · DIAGNOSTYKA KOMPUTEROWA</text><text x="760" y="60" text-anchor="end">ODCZYT NA ŻYWO</text><text x="60" y="235">SYGNAŁ CZUJNIKA</text>';
  } else if (nazwa === "kolo") {
    t = '<g transform="rotate(-4 400 360)"><rect class="l rys" pathLength="1" x="300" y="160" width="200" height="400" rx="40"/><rect class="l2" x="330" y="190" width="140" height="340" rx="24"/><path class="l2" d="M300 230h200M300 300h200M300 420h200M300 490h200"/></g>' +
      '<path class="wym" d="M400 110V610" stroke-dasharray="6 6"/><path class="hl" d="M414 130L386 590"/>' +
      '<path class="l rys" pathLength="1" d="M400 170A190 190 0 0 1 413 171"/><path class="wym" d="M150 360H650"/>' +
      '<text x="430" y="150">KĄT POCHYLENIA</text><text x="150" y="350">OŚ KOŁA</text>' +
      '<text x="40" y="60">RYS. 03 · GEOMETRIA KÓŁ</text><text x="760" y="60" text-anchor="end">POMIAR · REGULACJA</text>';
  } else if (nazwa === "klima") {
    t = bpAuto(0, 30, 1, true) +
      '<path class="l przeplyw" d="M560 380C500 350 430 345 360 350C300 355 260 370 240 400"/><path class="l przeplyw" d="M560 400C510 385 450 380 380 384"/>' +
      '<g transform="translate(400 170)"><path class="hl" d="M0-46V46M-40-23 40 23M-40 23 40-23M-10-38 0-28 10-38M-10 38 0 28 10 38"/></g>' +
      '<text x="40" y="60">RYS. 04 · KLIMATYZACJA</text><text x="760" y="60" text-anchor="end">OBIEG POWIETRZA</text><text x="400" y="250" text-anchor="middle">NAWIEW</text>';
  } else if (nazwa === "hamulce") {
    var otw = "";
    for (var k = 0; k < 12; k++) { var a = k / 12 * Math.PI * 2; otw += '<circle class="l2" cx="' + (400 + Math.cos(a) * 140).toFixed(1) + '" cy="' + (360 + Math.sin(a) * 140).toFixed(1) + '" r="8"/>'; }
    t = '<g class="obrot"><circle class="l rys" pathLength="1" cx="400" cy="360" r="200"/><circle class="l2" cx="400" cy="360" r="110"/>' + otw + '<circle class="l rys" pathLength="1" cx="400" cy="360" r="40"/></g>' +
      '<path class="hl" d="M540 190Q640 250 640 360Q640 470 540 530L510 500Q590 450 590 360Q590 270 510 220Z"/>' +
      '<text x="40" y="60">RYS. 05 · UKŁAD HAMULCOWY</text><text x="760" y="60" text-anchor="end">TARCZA · ZACISK</text><text x="660" y="365">ZACISK</text>';
  } else {
    t = '<path class="l rys" pathLength="1" d="M90 620H710M150 620V200M650 620V200M130 200h40M630 200h40"/><path class="l2" d="M150 430H300M650 430H520"/>' +
      bpAuto(70, 0, .82, true) +
      '<path class="wym" d="M110 300V600M100 300h20M100 600h20"/><text x="96" y="460" text-anchor="end">1,8 m</text>' +
      '<text x="40" y="60">RYS. 06 · PODNOŚNIK</text><text x="760" y="60" text-anchor="end">STANOWISKO 1</text>';
  }
  return w + t + "</svg>";
}

/* ---------- dane początkowe ---------- */
function daneStartowe() {
  var D = dzisISO();
  var it = function (o) { o.id = o.id || uid(); o.ukryta = !!o.ukryta; return o; };
  var kat = [
    it({ id: "k1", nazwa: "Silnik, płyny i LPG", opis: "Bieżąca obsługa i naprawy, które decydują o trwałości auta." }),
    it({ id: "k2", nazwa: "Diagnostyka i elektronika", opis: "Najpierw diagnoza, potem naprawa. Bez wymiany części „na próbę”." }),
    it({ id: "k3", nazwa: "Klimatyzacja", opis: "Serwis przez cały rok – czysty i sprawny układ to też zdrowie kierowcy." }),
    it({ id: "k4", nazwa: "Koła i opony", opis: "Wymiana, wyważenie, przechowanie i geometria." }),
    it({ id: "k5", nazwa: "Nadwozie i szyby", opis: "Drobne naprawy blacharskie i szyby bez wizyt w kilku miejscach." })
  ];
  var u = function (id, k, ik, nazwa, opis, czas, cena, glowna, extra) { return it(Object.assign({ id: id, kategoria: k, ikona: ik, nazwa: nazwa, opis: opis, czas: czas, cena: cena, glowna: glowna, nowosc: false, plakietka: "", zdjecie: "", przycisk: "zadzwon" }, extra || {})); };
  return {
    _app: APP_ID, _v: APP_WERSJA,
    firma: { nazwa: "Szalone auto", podpis: "Pełen profesjonalizm", haslo: "Naprawiamy porządnie. Rozliczamy uczciwie." },
    kontakt: { telefon: "601 601 601", sms: "601 601 601", email: "piotrzmyslony@wpp.pl", adres: "ul. Przykładowa 12", kod: "50-000", miasto: "Wrocław", dzielnica: "", facebook: "", instagram: "", googleOpinie: "" },
    start: {
      nadtytul: "Warsztat samochodowy · Wrocław",
      tytul: "Szalona nazwa. *Poważna robota.*",
      wstep: "Naprawiamy porządnie i rozliczamy uczciwie. Mechanika, klimatyzacja, diagnostyka i elektronika – ze szczególnym doświadczeniem w autach **BMW, Audi i Toyota**.",
      kartaTytul: "Wycena przed naprawą",
      kartaOpis: "Naprawę zaczynamy dopiero po Pana/Pani akceptacji kosztów."
    },
    onas: {
      nadtytul: "O firmie",
      tytul: "Szaleni na punkcie aut. *Poważni w pracy.*",
      wstep: "Skąd nazwa? Z pasji do motoryzacji. W pracy obowiązuje jedna zasada: pełen profesjonalizm.",
      naglowek: "Warsztat, do którego wraca się z kolejnym autem",
      tekst: "Szalone auto to niezależny warsztat samochodowy we Wrocławiu. Zajmujemy się mechaniką, klimatyzacją, diagnostyką komputerową, elektryką, oponami, geometrią, blacharstwem, instalacjami LPG i szybami. Obsługujemy kierowców prywatnych i firmy.\n\nStawiamy na **fachowość i dobrej jakości części**. Każdą naprawę poprzedza diagnoza i wycena, a wymienione części oddajemy do wglądu. Wiemy, że zaufanie do mechanika buduje się latami, a traci w jeden dzień.",
      zdjecie1: "bp:warsztat", zdjecie2: "img/o-nas.jpg"
    },
    info: {
      parking: "Bezpłatne miejsca dla klientów przed warsztatem.",
      komunikacja: "[DO UZUPEŁNIENIA] najbliższy przystanek i linie tramwajowe/autobusowe.",
      platnosci: "Karta płatnicza (także zbliżeniowo i telefonem), gotówka, przelew dla firm. Do każdej usługi paragon lub faktura VAT.",
      dostepnosc: "Wjazd do biura bez progów. Na prośbę odbierzemy auto sprzed drzwi.",
      gwarancja: "Na wykonane usługi udzielamy gwarancji – okres i warunki są opisane na fakturze. [DO UZUPEŁNIENIA: okres gwarancji]",
      odbior: "Auto zostawione rano można odebrać do 18:00 w dni robocze."
    },
    cennikUwaga: "Ceny orientacyjne, brutto, z robocizną. Ceny części ustalamy indywidualnie. Stawka roboczogodziny: 150–190 zł brutto, zależnie od rodzaju prac.",
    godziny: [
      { otwarte: true, od: "08:00", do: "18:00" }, { otwarte: true, od: "08:00", do: "18:00" }, { otwarte: true, od: "08:00", do: "18:00" },
      { otwarte: true, od: "08:00", do: "18:00" }, { otwarte: true, od: "08:00", do: "18:00" }, { otwarte: true, od: "09:00", do: "14:00" },
      { otwarte: false, od: "09:00", do: "14:00" }
    ],
    sekcje: SEKCJE_DOMYSLNE.map(function (s) { return Object.assign({}, s); }),
    slider: [
      it({ zdjecie: "bp:auto", podpis: "Kontrola ogólna przed każdą naprawą" }),
      it({ zdjecie: "bp:diagnoza", podpis: "Diagnostyka komputerowa BMW, Audi, Toyota" }),
      it({ zdjecie: "bp:klima", podpis: "Serwis klimatyzacji przez cały rok" })
    ],
    atuty: [it({ ikona: "tarcza", tekst: "Gwarancja na usługi" }), it({ ikona: "faktura", tekst: "Faktury VAT" }), it({ ikona: "karta", tekst: "Płatność kartą" })],
    wyrozniki: [
      it({ ikona: "chip", tytul: "Najpierw diagnoza", opis: "Szukamy przyczyny usterki, a nie wymieniamy części na próbę. Wynik pokazujemy i tłumaczymy." }),
      it({ ikona: "faktura", tytul: "Koszty przed naprawą", opis: "Podajemy przedział ceny przed rozpoczęciem pracy. Każdą dodatkową czynność uzgadniamy telefonicznie." }),
      it({ ikona: "olej", tytul: "Sprawdzone części", opis: "Montujemy części i płyny dobrej jakości, zgodne z normami producenta auta. Stare części oddajemy do wglądu." }),
      it({ ikona: "tarcza", tytul: "Gwarancja", opis: "Na wykonane usługi udzielamy gwarancji. Warunki znajdzie Pan/Pani na fakturze i w FAQ." })
    ],
    kategorie: kat,
    uslugi: [
      u("u1", "k1", "olej", "Wymiana oleju i płynów eksploatacyjnych", "Olej z filtrem, płyn chłodniczy, hamulcowy i do wspomagania. Płyny zgodne z normą producenta auta.", "ok. 1 h", "120–280 zł", true),
      u("u2", "k1", "hamulec", "Mechanika: hamulce, zawieszenie, rozrząd", "Klocki i tarcze, amortyzatory, wahacze, rozrząd. Przed naprawą podajemy kosztorys i czas realizacji.", "od 1 h", "180–1600 zł", true, { przycisk: "wycena" }),
      u("u3", "k1", "lpg", "Instalacje LPG – przegląd i regulacja", "Wymiana filtrów fazy lotnej i ciekłej, regulacja, diagnostyka sterownika gazu.", "ok. 1,5 h", "150–320 zł", false, { nowosc: true }),
      u("u4", "k2", "chip", "Diagnostyka komputerowa", "Odczyt i analiza błędów, parametry na żywo, kodowanie. Wynik omawiamy przed naprawą.", "30–60 min", "100–200 zł", true, { zdjecie: "bp:diagnoza" }),
      u("u5", "k2", "piorun", "Elektryka i elektronika", "Rozruszniki, alternatory, oświetlenie, czujniki, usterki instalacji elektrycznej.", "od 1 h", "150–650 zł", true, { przycisk: "wycena" }),
      u("u6", "k3", "sniezka", "Serwis klimatyzacji", "Odgrzybianie, kontrola szczelności, napełnienie czynnikiem, wymiana filtra kabinowego.", "ok. 1 h", "199–350 zł", true),
      u("u7", "k4", "kolo", "Wymiana opon i przechowalnia", "Wymiana z wyważeniem kompletu kół, przechowanie opon w suchym magazynie przez sezon.", "ok. 45 min", "100–250 zł", true),
      u("u8", "k4", "geometria", "Geometria kół", "Pomiar i ustawienie zbieżności. Wydruk wyników przed i po regulacji.", "ok. 1 h", "150–250 zł", false, { zdjecie: "bp:kolo" }),
      u("u9", "k5", "karoseria", "Blacharstwo", "Naprawy po drobnych kolizjach, usuwanie korozji, przygotowanie do lakierowania.", "wg wyceny", "300–2500 zł", false, { przycisk: "wycena" }),
      u("u10", "k5", "szyba", "Szyby samochodowe", "Wymiana i naprawa szyb, kalibracja kamery asystenta po wymianie szyby czołowej.", "2–4 h", "150–2200 zł", false, { przycisk: "wycena" })
    ],
    cennik: [
      ["k1", "Wymiana oleju silnikowego z filtrem", "z olejem do 5 l", "ok. 45 min", "od 120 zł"],
      ["k1", "Wymiana płynu hamulcowego", "", "ok. 45 min", "120–160 zł"],
      ["k1", "Wymiana klocków hamulcowych – oś", "", "ok. 1 h", "180–250 zł"],
      ["k1", "Wymiana tarcz i klocków – oś", "", "1–1,5 h", "250–450 zł"],
      ["k1", "Wymiana rozrządu", "zależnie od silnika", "3–8 h", "600–1600 zł"],
      ["k1", "Przegląd instalacji LPG", "z wymianą filtrów", "ok. 1,5 h", "150–320 zł"],
      ["k2", "Diagnostyka komputerowa", "z raportem błędów", "30–60 min", "100–200 zł"],
      ["k2", "Wymiana akumulatora z kodowaniem", "bez ceny akumulatora", "ok. 30 min", "80–150 zł"],
      ["k2", "Naprawa elektryki", "wg diagnozy", "od 1 h", "150–650 zł"],
      ["k3", "Serwis klimatyzacji", "odgrzybianie + napełnienie", "ok. 1 h", "199–350 zł"],
      ["k4", "Wymiana kompletu kół z wyważeniem", "felgi stalowe / aluminiowe", "ok. 45 min", "100–200 zł"],
      ["k4", "Przechowanie opon – sezon", "z myciem kół", "", "150–250 zł"],
      ["k4", "Geometria kół", "z wydrukiem", "ok. 1 h", "150–250 zł"],
      ["k5", "Naprawa blacharska", "wycena po oględzinach", "", "od 300 zł"],
      ["k5", "Wymiana szyby czołowej", "z kalibracją kamery", "2–4 h", "od 600 zł"]
    ].map(function (r) { return it({ kategoria: r[0], nazwa: r[1], dopisek: r[2], czas: r[3], cena: r[4] }); }),
    pakiety: [
      it({ nazwa: "Pakiet Sezon", cena: "229 zł", dopisek: "brutto / sezon", opis: "Dla osób, które nie chcą trzymać opon w piwnicy.", punkty: "Wymiana kompletu kół z wyważeniem\nPrzechowanie opon do następnego sezonu\nKontrola płynów i oświetlenia", wyrozniony: false }),
      it({ nazwa: "Pakiet Przed Trasą", cena: "299 zł", dopisek: "brutto", opis: "Przed wakacjami lub dłuższym wyjazdem.", punkty: "Diagnostyka komputerowa\nPrzegląd hamulców i zawieszenia\nKontrola klimatyzacji i płynów\nPisemny raport stanu auta", wyrozniony: true }),
      it({ nazwa: "Pakiet Firma", cena: "od 150 zł", dopisek: "netto / rbh", opis: "Dla firm z flotą od 3 samochodów.", punkty: "Stała stawka roboczogodziny\nPierwszeństwo terminów\nFaktura zbiorcza z odroczonym terminem płatności", wyrozniony: false })
    ],
    marki: [
      it({ nazwa: "BMW", opis: "diagnostyka i kodowanie, układy chłodzenia, zawieszenie" }),
      it({ nazwa: "AUDI", opis: "skrzynie S tronic – obsługa, rozrząd, elektronika" }),
      it({ nazwa: "TOYOTA", opis: "hybrydy – przeglądy, klimatyzacja, układ hamulcowy" })
    ],
    kroki: [
      it({ tytul: "Telefon", opis: "Dzwoni Pan/Pani do nas. Prosimy podać markę, model i opis problemu – ustalimy termin." }),
      it({ tytul: "Przyjazd i diagnoza", opis: "Przyjmujemy auto, sprawdzamy usterkę i przygotowujemy kosztorys." }),
      it({ tytul: "Akceptacja kosztów", opis: "Dzwonimy z wyceną. Naprawiamy dopiero po Pana/Pani zgodzie." }),
      it({ tytul: "Odbiór i gwarancja", opis: "Oddajemy auto z fakturą, opisem prac i wymienionymi częściami do wglądu." })
    ],
    promocje: [
      it({ tytul: "Serwis klimatyzacji od 199 zł", opis: "Odgrzybianie, kontrola szczelności i napełnienie układu w promocyjnej cenie. Proszę zadzwonić i podać markę i model auta.", plakietka: "od 199 zł", zdjecie: "bp:klima", usluga: "u6", naPasku: true, od: dodajDni(D, -16), do: dodajDni(D, 30), wstrzymana: false }),
      it({ tytul: "Wymiana opon + przechowalnia −15%", opis: "Przy wymianie kół z przechowaniem opon do wiosny – 15% taniej. Liczba terminów w listopadzie jest ograniczona.", plakietka: "−15%", zdjecie: "bp:kolo", usluga: "u7", naPasku: true, od: D, do: dodajDni(D, 45), wstrzymana: false }),
      it({ tytul: "Zimowy test akumulatora gratis", opis: "Przy każdej wymianie oleju sprawdzimy akumulator i ładowanie przed mrozami.", plakietka: "Gratis", zdjecie: "", usluga: "u1", naPasku: false, od: dodajDni(D, 40), do: dodajDni(D, 80), wstrzymana: false }),
      it({ tytul: "Diagnostyka przed wakacjami −20%", opis: "Promocja letnia.", plakietka: "−20%", zdjecie: "bp:diagnoza", usluga: "u4", naPasku: false, od: dodajDni(D, -75), do: dodajDni(D, -20), wstrzymana: false })
    ],
    aktualnosci: [
      it({ tytul: "Ruszyły zapisy na wymianę opon", tresc: "Sezon zimowy zaczyna się szybko. Proszę zadzwonić wcześniej – w listopadzie terminy kończą się w kilka dni.", data: D, zdjecie: "", naPasku: true, od: D, do: dodajDni(D, 40), wstrzymana: false }),
      it({ tytul: "Nowość: przeglądy instalacji LPG", tresc: "Wymiana filtrów i regulacja instalacji gazowej na miejscu, bez dodatkowej wizyty w innym serwisie.", data: dodajDni(D, -30), zdjecie: "", naPasku: false, od: dodajDni(D, -30), do: dodajDni(D, 30), wstrzymana: false }),
      it({ tytul: "11 listopada warsztat nieczynny", tresc: "W Narodowe Święto Niepodległości warsztat będzie zamknięty. Zapraszamy w czwartek od 8:00.", data: dodajDni(D, 20), zdjecie: "", naPasku: true, od: dodajDni(D, 20), do: "2026-11-11", wstrzymana: false })
    ],
    galeria: [
      it({ zdjecie: "bp:warsztat", podpis: "Stanowisko z podnośnikiem", kategoria: "Warsztat" }),
      it({ zdjecie: "bp:diagnoza", podpis: "Odczyt parametrów na żywo", kategoria: "Diagnostyka" }),
      it({ zdjecie: "bp:klima", podpis: "Serwis klimatyzacji", kategoria: "Klimatyzacja" }),
      it({ zdjecie: "bp:kolo", podpis: "Pomiar geometrii kół", kategoria: "Koła i opony" }),
      it({ zdjecie: "bp:hamulce", podpis: "Wymiana tarcz i klocków", kategoria: "Warsztat" }),
      it({ zdjecie: "bp:auto", podpis: "Kontrola przed odbiorem auta", kategoria: "Warsztat" })
    ],
    zespol: [
      it({ imie: "Piotr Zmyślony", rola: "Właściciel, mechanik", opis: "Odpowiada za wyceny i kontakt z klientami.", zdjecie: "" }),
      it({ imie: "Tomasz", rola: "Diagnosta", opis: "Diagnostyka komputerowa i elektronika BMW oraz Audi.", zdjecie: "" }),
      it({ imie: "Łukasz", rola: "Mechanik", opis: "Klimatyzacja, instalacje LPG, geometria kół.", zdjecie: "" }),
      it({ imie: "Krzysztof", rola: "Blacharz", opis: "Blacharstwo i wymiana szyb.", zdjecie: "" })
    ],
    opinie: [],
    faq: [
      ["Czy muszę umówić wizytę wcześniej?", "Tak, wizyty umawiamy telefonicznie. Dzięki temu nie czeka Pan/Pani na miejscu, a my rezerwujemy stanowisko i części."],
      ["Jakie informacje przygotować do rozmowy?", "Markę i model auta, rok produkcji, a jeśli to możliwe – pojemność silnika lub numer VIN oraz krótki opis problemu."],
      ["Skąd wiem, ile zapłacę?", "Ceny w cenniku są orientacyjne. Po diagnozie dzwonimy z kosztorysem i rozpoczynamy naprawę dopiero po Pana/Pani akceptacji."],
      ["Czy mogę przywieźć własne części?", "Tak, po wcześniejszym uzgodnieniu. Gwarancja obejmuje wtedy wykonaną usługę, ale nie samą część."],
      ["Jaka jest gwarancja na usługi?", "Na usługi udzielamy gwarancji – okres i warunki są opisane na fakturze."],
      ["Czy wystawiacie faktury VAT dla firm?", "Tak. Dla firm z flotą oferujemy też Pakiet Firma ze stałą stawką i fakturą zbiorczą."],
      ["Czy serwis u Państwa unieważnia gwarancję producenta?", "Nie. Zgodnie z przepisami UE serwis w niezależnym warsztacie nie unieważnia gwarancji producenta, jeśli używamy części odpowiedniej jakości i wpisujemy obsługę do książki serwisowej."]
    ].map(function (r) { return it({ pytanie: r[0], odpowiedz: r[1] }); }),
    czesci: [
      it({ tekst: "Części oryginalne (OE) i zamienniki jakości OE" }),
      it({ tekst: "Oleje i płyny z normami producentów aut" }),
      it({ tekst: "[DO UZUPEŁNIENIA] marki części, olejów i sprzętu diagnostycznego" })
    ],
    dniSpecjalne: [
      it({ data: "2026-11-01", nieczynne: true, od: "", do: "", opis: "Wszystkich Świętych" }),
      it({ data: "2026-11-11", nieczynne: true, od: "", do: "", opis: "Narodowe Święto Niepodległości" }),
      it({ data: "2026-12-24", nieczynne: false, od: "08:00", do: "12:00", opis: "Wigilia" }),
      it({ data: "2026-12-25", nieczynne: true, od: "", do: "", opis: "Boże Narodzenie" }),
      it({ data: "2026-12-26", nieczynne: true, od: "", do: "", opis: "Drugi dzień świąt" }),
      it({ data: "2026-12-31", nieczynne: false, od: "08:00", do: "14:00", opis: "Sylwester" })
    ]
  };
}

/* Sekcje strony: widok (podstrona) + domyślne nagłówki */
var SEKCJE_DOMYSLNE = [
  { id: "hero", widok: "start", nazwa: "Nagłówek ze sliderem", widoczna: true, nadtytul: "", tytul: "", wstep: "" },
  { id: "promocje", widok: "start", nazwa: "Promocje", widoczna: true, nadtytul: "Promocje", tytul: "Aktualne promocje", wstep: "Oferty ograniczone w czasie. Proszę zadzwonić i powołać się na promocję." },
  { id: "wyrozniki", widok: "start", nazwa: "Dlaczego my", widoczna: true, nadtytul: "Dlaczego my", tytul: "Jakość serwisu autoryzowanego, rozliczenie jak w warsztacie niezależnym", wstep: "" },
  { id: "polecane", widok: "start", nazwa: "Najczęściej wybierane usługi", widoczna: true, nadtytul: "Oferta", tytul: "Najczęściej wybierane usługi", wstep: "Ceny orientacyjne, brutto, z robocizną. Dokładną kwotę podajemy po rozmowie lub oględzinach." },
  { id: "marki", widok: "start", nazwa: "Specjalizacja (marki)", widoczna: true, nadtytul: "Specjalizacja", tytul: "Znamy te auta od podszewki", wstep: "Naprawiamy samochody wszystkich marek. Najwięcej doświadczenia mamy z trzema – mamy do nich oprogramowanie diagnostyczne i znamy ich typowe usterki." },
  { id: "kroki", widok: "start", nazwa: "Jak wygląda wizyta", widoczna: true, nadtytul: "Jak wygląda wizyta", tytul: "Od telefonu do odbioru auta", wstep: "" },
  { id: "aktualnosci", widok: "start", nazwa: "Aktualności", widoczna: true, nadtytul: "Dla naszych klientów", tytul: "Aktualności", wstep: "" },
  { id: "uslugi", widok: "uslugi", nazwa: "Usługi (wg kategorii)", widoczna: true, nadtytul: "Oferta", tytul: "Usługi warsztatu", wstep: "Usługi w podziale na kategorie. Przy każdej podajemy orientacyjny przedział ceny brutto." },
  { id: "pakiety", widok: "uslugi", nazwa: "Pakiety", widoczna: true, nadtytul: "Pakiety", tytul: "Pakiety – kilka usług w jednej wizycie", wstep: "Taniej niż osobno i bez kilku przyjazdów." },
  { id: "cennik", widok: "cennik", nazwa: "Cennik", widoczna: true, nadtytul: "Cennik", tytul: "Cennik usług", wstep: "Kwota zależy od modelu auta i stanu części – dokładną cenę podajemy przed naprawą." },
  { id: "platnosci", widok: "cennik", nazwa: "Płatności i gwarancja", widoczna: true, nadtytul: "Płatności", tytul: "Płatności i gwarancja", wstep: "" },
  { id: "faq", widok: "cennik", nazwa: "Najczęstsze pytania", widoczna: true, nadtytul: "FAQ", tytul: "Najczęstsze pytania", wstep: "" },
  { id: "onas", widok: "o-nas", nazwa: "O firmie", widoczna: true, nadtytul: "", tytul: "", wstep: "" },
  { id: "zespol", widok: "o-nas", nazwa: "Zespół", widoczna: true, nadtytul: "Zespół", tytul: "Ludzie, którzy zajmą się Pana/Pani autem", wstep: "" },
  { id: "galeria", widok: "o-nas", nazwa: "Galeria", widoczna: true, nadtytul: "Galeria", tytul: "Warsztat od środka", wstep: "" },
  { id: "czesci", widok: "o-nas", nazwa: "Części i produkty", widoczna: true, nadtytul: "Części i produkty", tytul: "Z czym pracujemy", wstep: "Montujemy części oryginalne lub zamienniki renomowanych producentów oraz oleje spełniające normy producenta auta." },
  { id: "opinie", widok: "o-nas", nazwa: "Opinie klientów", widoczna: true, nadtytul: "Opinie", tytul: "Opinie klientów", wstep: "" },
  { id: "kontakt", widok: "kontakt", nazwa: "Kontakt i godziny", widoczna: true, nadtytul: "Kontakt", tytul: "Zapraszamy do warsztatu", wstep: "Wizyty umawiamy telefonicznie. Prosimy podać markę i model auta." },
  { id: "dojazd", widok: "kontakt", nazwa: "Mapa i dojazd", widoczna: true, nadtytul: "Mapa i dojazd", tytul: "", wstep: "" },
  { id: "wycena", widok: "kontakt", nazwa: "Formularz wyceny", widoczna: true, nadtytul: "Zapytanie o wycenę", tytul: "Wycena przed wizytą", wstep: "Proszę opisać auto i problem. Formularz przygotuje gotową wiadomość SMS lub e-mail – po jej wysłaniu oddzwonimy z orientacyjną ceną i terminem." }
];
var WIDOKI = [["start", "Start"], ["uslugi", "Usługi"], ["cennik", "Cennik"], ["o-nas", "O nas"], ["kontakt", "Kontakt"]];
