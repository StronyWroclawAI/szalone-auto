/* =====================================================================
   2) RENDEROWANIE STRONY Z DANYCH
   ===================================================================== */
var S = daneStartowe();        // bieżący stan (po wczytaniu – scalony z zapisem)
var WIDOK = "start";
var preselectUsluga = "";

function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function fmtLinia(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, '<em class="acc">$1</em>')
    .replace(/\[DO UZUPEŁNIENIA[^\]]*\]/g, function (m) { return '<span class="uzupelnij">' + m.slice(1, -1) + "</span>"; }).replace(/\n/g, "<br>");
}
function fmt(s) { return String(s || "").split(/\n\s*\n/).filter(function (p) { return p.trim(); }).map(function (p) { return "<p>" + fmtLinia(p.trim()) + "</p>"; }).join(""); }
function cyfry(t) { return String(t || "").replace(/\D/g, ""); }
function telHref() { var c = cyfry(S.kontakt.telefon); return "tel:" + (c.length === 9 ? "+48" + c : c); }
function smsHref(body) { var c = cyfry(S.kontakt.sms || S.kontakt.telefon); return "sms:" + (c.length === 9 ? "+48" + c : c) + (body ? "?body=" + encodeURIComponent(body) : ""); }
function adresPelny() { var k = S.kontakt; return k.adres + ", " + k.kod + " " + k.miasto; }
function mapaLink() { return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(S.kontakt.adres + ", " + S.kontakt.miasto); }
function widoczne(lista) { return (lista || []).filter(function (x) { return !x.ukryta; }); }

function obraz(src, alt, cls) {
  if (!src) return "";
  if (String(src).indexOf("bp:") === 0) return grafika(src.slice(3), cls);
  return '<img src="' + esc(src) + '" alt="' + esc(alt || "") + '" loading="lazy" decoding="async"' + (cls ? ' class="' + cls + '"' : "") + ' onerror="this.remove()">';
}
function foto(src, alt, opis, klasa, styl) {
  return '<figure class="foto ' + (klasa || "") + '"' + (styl ? ' style="' + styl + '"' : "") + ">" + obraz(src, alt) + (opis ? "<figcaption>" + esc(opis) + "</figcaption>" : "") + "</figure>";
}

/* ---------- treści czasowe ---------- */
function statusCzasowy(it, D) {
  D = D || dzisISO();
  if (it.wstrzymana) return "wstrzymana";
  if (it.od && it.od > D) return "zaplanowana";
  if (it.do && it.do < D) return "zakonczona";
  return "aktywna";
}
function aktywne(lista) { return widoczne(lista).filter(function (x) { return statusCzasowy(x) === "aktywna"; }); }
var STATUS_NAZWY = { aktywna: "Aktywna", zaplanowana: "Zaplanowana", zakonczona: "Zakończona", wstrzymana: "Wstrzymana" };

/* ---------- godziny otwarcia ---------- */
function minuty(hhmm) { if (!hhmm) return null; var p = hhmm.split(":"); return +p[0] * 60 + +p[1]; }
function godz(hhmm) { return hhmm ? String(+hhmm.split(":")[0]) + ":" + hhmm.split(":")[1] : ""; }
function dzienTyg(iso) { return (zISO(iso).getDay() + 6) % 7; } // 0 = poniedziałek
function dzienSpecjalny(iso) { return widoczne(S.dniSpecjalne).filter(function (d) { return d.data === iso; })[0]; }
function godzinyDnia(iso) {
  var sp = dzienSpecjalny(iso);
  if (sp) return sp.nieczynne ? { otwarte: false, specjalny: sp } : { otwarte: true, od: sp.od, do: sp.do, specjalny: sp };
  var g = S.godziny[dzienTyg(iso)] || {};
  return g.otwarte ? { otwarte: true, od: g.od, do: g.do } : { otwarte: false };
}
function stanOtwarcia(teraz) {
  teraz = teraz || new Date();
  var D = dzisISO(teraz), m = teraz.getHours() * 60 + teraz.getMinutes(), g = godzinyDnia(D);
  if (g.otwarte && m >= minuty(g.od) && m < minuty(g.do)) {
    var zostalo = minuty(g.do) - m;
    return { stan: zostalo <= 60 ? "wkrotce" : "otwarte", tekst: (zostalo <= 60 ? "Otwarte · zamykamy o " : "Otwarte teraz · do ") + godz(g.do) };
  }
  if (g.otwarte && m < minuty(g.od)) return { stan: "zamkniete", tekst: "Zamknięte · otwieramy dziś o " + godz(g.od) };
  for (var i = 1; i <= 14; i++) {
    var d = dodajDni(D, i), gg = godzinyDnia(d);
    if (gg.otwarte) return { stan: "zamkniete", tekst: "Zamknięte · otwieramy " + (i === 1 ? "jutro" : DNI_W[dzienTyg(d)]) + " o " + godz(gg.od) };
  }
  return { stan: "zamkniete", tekst: "Zamknięte" };
}
function nadchodzaceZmiany(dni) {
  var D = dzisISO(), K = dodajDni(D, dni || 60);
  return widoczne(S.dniSpecjalne).filter(function (d) { return d.data >= D && d.data <= K; }).sort(function (a, b) { return a.data < b.data ? -1 : 1; });
}

/* ---------- sekcje ---------- */
function sek(id) { return S.sekcje.filter(function (s) { return s.id === id; })[0] || {}; }
function sekWidoczna(id) { return sek(id).widoczna !== false; }
function naglowek(id, extraP) {
  var s = sek(id);
  return '<div class="naglowek-sekcji">' + (s.nadtytul ? '<span class="etykieta">' + esc(s.nadtytul) + "</span>" : "") +
    (s.tytul ? '<h2 id="h-' + id + '">' + fmtLinia(s.tytul) + "</h2>" : "") + (s.wstep ? "<p>" + fmtLinia(s.wstep) + "</p>" : "") + (extraP || "") + "</div>";
}
function sekcja(id, klasa, wnetrze) {
  if (!sekWidoczna(id)) return "";
  return '<section class="sekcja ' + (klasa || "") + '" id="sek-' + id + '" data-sek="' + id + '" aria-labelledby="h-' + id + '"><div class="wrap">' + wnetrze + "</div></section>";
}

/* ---------- logo ---------- */
function logoSVG() {
  return '<svg viewBox="0 0 330 64" role="img" aria-label="' + esc(S.firma.nazwa) + " – " + esc(S.firma.podpis) + '"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="7">' +
    '<path d="M8 52H38A11 11 0 0 0 38 30H26A11 11 0 0 1 26 8H40" stroke="#FFFFFF"/><path d="M50 8H56" stroke="#C9A35B"/></g>' +
    '<text x="76" y="34" font-family="Archivo, \'Arial Black\', sans-serif" font-stretch="125%" font-weight="800" font-size="25" fill="#FFFFFF">' + esc(S.firma.nazwa.toUpperCase()) + "</text>" +
    '<text x="77" y="54" font-family="Archivo, Arial, sans-serif" font-weight="500" font-size="9.4" letter-spacing="4.2" fill="#C9A35B">' + esc(S.firma.podpis.toUpperCase()) + "</text></svg>";
}

/* ---------- elementy wspólne ---------- */
function elementyPaska() {
  var el = [];
  aktywne(S.promocje).forEach(function (p) { if (p.naPasku && sekWidoczna("promocje")) el.push({ typ: "Promocja", tytul: p.tytul, cel: "promocje" }); });
  aktywne(S.aktualnosci).forEach(function (a) { if (a.naPasku && sekWidoczna("aktualnosci")) el.push({ typ: "Aktualność", tytul: a.tytul, cel: "aktualnosci" }); });
  return el;
}
function htmlTopbar() {
  var el = elementyPaska(), st = stanOtwarcia();
  var tick = el.length ? '<div class="ticker" aria-live="off"><span class="ticker__licz" data-ticker-licz>1/' + el.length + '</span><div class="ticker__okno">' +
    el.map(function (e, i) { return '<div class="ticker__el' + (i === 0 ? " on" : "") + '"><b>' + e.typ + ':</b> <a href="#' + e.cel + '">' + esc(e.tytul) + "</a></div>"; }).join("") + "</div></div>" : "";
  return '<div class="topbar"><div class="wrap"><span class="status" data-status data-stan="' + st.stan + '"><i></i><span>' + st.tekst + "</span></span>" + tick +
    '<span><a href="' + telHref() + '">tel. ' + esc(S.kontakt.telefon) + '</a><span class="topbar__adres"> · ' + esc(adresPelny()) + "</span></span></div></div>";
}
function pozycjeMenu() {
  var m = WIDOKI.map(function (w) { return { href: w[0], nazwa: w[1] }; });
  if (sekWidoczna("promocje") && aktywne(S.promocje).length) m.splice(3, 0, { href: "promocje", nazwa: "Promocje" });
  if (sekWidoczna("aktualnosci") && aktywne(S.aktualnosci).length) m.splice(m.length - 2, 0, { href: "aktualnosci", nazwa: "Aktualności" });
  return m;
}
function htmlHeader() {
  var li = pozycjeMenu().map(function (p) { return '<li><a href="#' + p.href + '"' + (p.href === WIDOK ? ' aria-current="page"' : "") + ">" + p.nazwa + "</a></li>"; }).join("");
  return '<header class="header"><div class="wrap"><a class="logo" href="#start" aria-label="' + esc(S.firma.nazwa) + ' – strona główna">' + logoSVG() + "</a>" +
    '<nav class="nav" id="nawigacja" aria-label="Menu główne"><ul>' + li + "</ul></nav>" +
    '<a class="btn btn--glowny" href="' + telHref() + '">' + ico("tel") + '<span class="sr">Zadzwoń: </span>' + esc(S.kontakt.telefon) + "</a>" +
    '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nawigacja"><span class="sr">Menu</span>' + ico("menu") + "</button></div></header>";
}
function htmlPasCta() {
  return '<section class="pas-cta" aria-label="Umów wizytę"><div class="wrap"><div><h2>Proszę zadzwonić – umówimy termin</h2><p>Wizyty umawiamy telefonicznie. Przy rozmowie prosimy podać markę i model auta.</p></div>' +
    '<div class="centr"><a class="btn btn--glowny" href="' + telHref() + '">' + ico("tel") + esc(S.kontakt.telefon) + '</a><a class="btn btn--obrys" href="' + smsHref() + '">' + ico("sms") + "Wyślij SMS</a></div></div></section>";
}
function htmlStopka() {
  var k = S.kontakt, g = S.godziny;
  var godzKrotko = [];
  var pf = g.slice(0, 5).every(function (d) { return d.otwarte === g[0].otwarte && d.od === g[0].od && d.do === g[0].do; });
  if (pf) godzKrotko.push("Pon.–pt. " + (g[0].otwarte ? godz(g[0].od) + "–" + godz(g[0].do) : "nieczynne"));
  else g.slice(0, 5).forEach(function (d, i) { godzKrotko.push(DNI[i].slice(0, 3) + ". " + (d.otwarte ? godz(d.od) + "–" + godz(d.do) : "nieczynne")); });
  godzKrotko.push("Sobota " + (g[5].otwarte ? godz(g[5].od) + "–" + godz(g[5].do) : "nieczynne"));
  godzKrotko.push("Niedziela " + (g[6].otwarte ? godz(g[6].od) + "–" + godz(g[6].do) : "nieczynne"));
  var social = (k.facebook ? '<a href="' + esc(k.facebook) + '" target="_blank" rel="noopener" aria-label="Facebook">' + ico("fb") + "</a>" : '<a href="#kontakt" aria-label="Facebook (link do uzupełnienia)">' + ico("fb") + "</a>") +
    (k.instagram ? '<a href="' + esc(k.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram">' + ico("ig") + "</a>" : '<a href="#kontakt" aria-label="Instagram (link do uzupełnienia)">' + ico("ig") + "</a>");
  return '<footer class="stopka"><div class="wrap">' +
    '<div style="display:grid;gap:1rem"><a class="logo" href="#start" aria-label="Strona główna">' + logoSVG() + "</a><p>" + fmtLinia(S.firma.haslo) + '</p><div class="social">' + social + "</div></div>" +
    "<div><h3>Kontakt</h3><ul><li><a href=\"" + telHref() + '">tel. ' + esc(k.telefon) + '</a></li><li><a href="' + smsHref() + '">SMS: ' + esc(k.sms || k.telefon) + '</a></li><li><a href="mailto:' + esc(k.email) + '">' + esc(k.email) + "</a></li><li>" + esc(adresPelny()) + "</li></ul></div>" +
    "<div><h3>Godziny</h3><ul>" + godzKrotko.map(function (t) { return "<li>" + t + "</li>"; }).join("") + '</ul><h3 style="margin-top:1.2rem">Strony</h3><ul>' + WIDOKI.slice(1).map(function (w) { return '<li><a href="#' + w[0] + '">' + w[1] + "</a></li>"; }).join("") + "</ul></div>" +
    '<div><h3>Przypomnienia sezonowe</h3><p style="margin-bottom:.8rem">Raz w miesiącu: wymiana opon, serwis klimatyzacji, promocje. Bez spamu.</p><form class="newsletter" data-newsletter novalidate><label class="sr" for="nl-email">Adres e-mail</label><input id="nl-email" type="email" required placeholder="Pana/Pani e-mail" autocomplete="email"><button class="btn btn--glowny" type="submit">Zapisz się</button><p class="komunikat" role="status" hidden></p></form></div>' +
    '</div><div class="stopka__dol"><div class="wrap"><span>© ' + new Date().getFullYear() + " " + esc(S.firma.nazwa) + ' · Faktury VAT · Płatność kartą · <button type="button" class="link-btn" data-cms-otworz>Panel administratora</button></span><span>Projekt i wykonanie: Strony AI Wrocław</span></div></div></footer>' +
    '<nav class="pasek-mobilny" aria-label="Szybki kontakt"><a href="' + telHref() + '">' + ico("tel") + 'Zadzwoń</a><a href="' + smsHref() + '">' + ico("sms") + 'SMS</a><a href="' + mapaLink() + '" target="_blank" rel="noopener">' + ico("pin") + "Dojazd</a></nav>";
}
function podhero(okruszek, id) {
  var s = sek(id);
  return '<section class="podhero"><div class="wrap"><p class="okruszki"><a href="#start">Start</a> / ' + okruszek + "</p>" + (s.nadtytul ? '<span class="etykieta">' + esc(s.nadtytul) + "</span>" : "") +
    "<h1>" + fmtLinia(s.tytul || okruszek) + "</h1>" + (s.wstep ? "<p>" + fmtLinia(s.wstep) + "</p>" : "") + "</div></section>";
}

/* ---------- karty ---------- */
function promoDlaUslugi(id) { return aktywne(S.promocje).filter(function (p) { return p.usluga === id && sekWidoczna("promocje"); })[0]; }
function kartaUslugi(u) {
  var pr = promoDlaUslugi(u.id), zn = "";
  if (pr) zn += '<span class="znaczek znaczek--promo">' + esc(pr.plakietka || "Promocja") + "</span>";
  if (u.nowosc) zn += '<span class="znaczek znaczek--nowosc">Nowość</span>';
  if (u.plakietka) zn += '<span class="znaczek znaczek--wlasny">' + esc(u.plakietka) + "</span>";
  var przycisk = u.przycisk === "wycena" ? '<a class="btn btn--obrys" href="#wycena" data-usluga="' + u.id + '">Zapytaj o wycenę</a>' : '<a class="btn btn--ciemny" href="' + telHref() + '">' + ico("tel") + "Zadzwoń i umów</a>";
  return '<article class="usluga odslon" id="usluga-' + u.id + '">' + (u.zdjecie ? '<div class="usluga__foto">' + obraz(u.zdjecie, u.nazwa) + "</div>" : "") +
    '<div class="usluga__gora"><span class="usluga__ikona">' + ico(u.ikona) + '</span><span class="znaczki">' + zn + "</span></div>" +
    "<h3>" + esc(u.nazwa) + "</h3><div style=\"display:grid;gap:.5rem;align-content:start\"><p>" + fmtLinia(u.opis) + "</p>" + (u.czas ? '<span class="usluga__meta">' + ico("zegar", "ik-mala") + esc(u.czas) + "</span>" : "") + "</div>" +
    '<div class="usluga__cena"><span>' + esc(u.cena) + '</span><small>orientacyjnie, brutto</small></div><div class="usluga__akcje">' + przycisk + "</div></article>";
}
function pozostalo(doISO) {
  if (!doISO) return "Bez terminu końca";
  var koniec = zISO(doISO); koniec.setHours(23, 59, 59);
  var ms = koniec - new Date(); if (ms <= 0) return "Kończy się dziś";
  var dni = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), min = Math.floor(ms % 36e5 / 6e4);
  return dni > 0 ? "Zostało " + dni + " " + (dni === 1 ? "dzień" : "dni") + " " + h + " h" : "Zostało " + h + " h " + min + " min";
}
function postepProc(od, doISO) {
  if (!doISO) return 100;
  var a = zISO(od || dzisISO()).getTime(), b = zISO(doISO); b.setHours(23, 59, 59);
  return Math.max(2, Math.min(100, (Date.now() - a) / (b - a) * 100));
}
function kartaPromocji(p) {
  var u = S.uslugi.filter(function (x) { return x.id === p.usluga && !x.ukryta; })[0];
  return '<article class="promo odslon"><div class="promo__foto">' + (p.zdjecie ? obraz(p.zdjecie, p.tytul) : grafika("auto")) + (p.plakietka ? '<span class="promo__plak">' + esc(p.plakietka) + "</span>" : "") + "</div>" +
    '<div class="promo__tresc"><h3>' + esc(p.tytul) + "</h3><p>" + fmtLinia(p.opis) + "</p>" +
    '<div class="promo__termin"><div><span>' + (p.do ? "Ważne do " + dataSlownie(p.do).replace(/ \d{4}$/, "") : "Oferta stała") + '</span><strong data-odliczanie="' + (p.do || "") + '">' + pozostalo(p.do) + "</strong></div>" +
    '<div class="postep" role="progressbar" aria-label="Czas trwania promocji" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(postepProc(p.od, p.do)) + '"><i style="width:' + postepProc(p.od, p.do).toFixed(1) + '%"></i></div></div>' +
    '<div class="centr"><a class="btn btn--glowny" href="' + telHref() + '">' + ico("tel") + "Zadzwoń i umów</a>" + (u ? '<a class="btn btn--obrys" href="#usluga-' + u.id + '" data-do-uslugi="' + u.id + '">' + esc(u.nazwa.split(" – ")[0].split(":")[0]) + "</a>" : "") + "</div></div></article>";
}
function gwiazdki(n) { var h = ""; for (var i = 1; i <= 5; i++) h += ico("gwiazda", i <= n ? "" : "pusta"); return '<span class="gwiazdki" aria-label="Ocena ' + n + ' na 5">' + h.replace(/<svg/g, '<svg fill="currentColor"') + "</span>"; }
function tabelaGodzin() {
  var dzis = dzienTyg(dzisISO());
  return '<table class="godziny"><caption class="sr">Godziny otwarcia</caption><tbody>' + S.godziny.map(function (g, i) {
    return '<tr' + (i === dzis ? ' class="dzis" aria-current="date"' : "") + '><th scope="row">' + DNI[i] + (i === dzis ? " (dziś)" : "") + "</th><td>" + (g.otwarte ? godz(g.od) + " – " + godz(g.do) : "nieczynne") + "</td></tr>";
  }).join("") + "</tbody></table>";
}
function htmlZmiany() {
  var z = nadchodzaceZmiany(60);
  if (!z.length) return "";
  return '<div class="zmiany"><h4>Zmiany w godzinach</h4><ul>' + z.map(function (d) {
    return '<li><span><time datetime="' + d.data + '">' + dataKrotko(d.data) + "</time> · " + esc(d.opis) + "</span><strong>" + (d.nieczynne ? "nieczynne" : godz(d.od) + "–" + godz(d.do)) + "</strong></li>";
  }).join("") + "</ul></div>";
}

/* ---------- widoki ---------- */
function widokStart() {
  var st = S.start, h = "";
  if (sekWidoczna("hero")) {
    var sl = widoczne(S.slider);
    var slajdy = sl.length ? sl.map(function (s, i) { return '<figure class="slajd' + (i === 0 ? " on" : "") + '">' + obraz(s.zdjecie, s.podpis) + (s.podpis ? "<figcaption>" + esc(s.podpis) + "</figcaption>" : "") + "</figure>"; }).join("") : '<figure class="slajd on">' + grafika("auto") + "</figure>";
    var kropki = sl.length > 1 ? '<div class="kropki" role="group" aria-label="Wybór zdjęcia">' + sl.map(function (s, i) { return '<button type="button" data-slajd="' + i + '" aria-label="Zdjęcie ' + (i + 1) + " z " + sl.length + '"' + (i === 0 ? ' aria-current="true"' : "") + "></button>"; }).join("") + "</div>" : "";
    h += '<section class="hero" id="sek-hero" data-sek="hero" aria-labelledby="h1"><svg class="hero__linia" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 52H38A11 11 0 0 0 38 30H26A11 11 0 0 1 26 8H40" fill="none" stroke="#C9A35B" stroke-width="5" stroke-linecap="round"/></svg><div class="wrap">' +
      '<div class="hero__tekst"><span class="etykieta">' + esc(st.nadtytul) + '</span><h1 id="h1">' + fmtLinia(st.tytul).replace('class="acc"', 'class="acc" style="display:block"') + '</h1><div class="hero__lead">' + fmt(st.wstep) + "</div>" +
      '<div class="hero__cta"><a class="btn btn--glowny" href="' + telHref() + '">' + ico("tel") + "Zadzwoń: " + esc(S.kontakt.telefon) + '</a><a class="btn btn--obrys" href="#dojazd">' + ico("pin") + "Jak dojechać</a></div>" +
      '<ul class="hero__fakty">' + widoczne(S.atuty).map(function (a) { return "<li>" + ico(a.ikona) + esc(a.tekst) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="hero__foto"><div class="slider" aria-roledescription="karuzela" aria-label="Zdjęcia warsztatu">' + slajdy + kropki + "</div>" +
      (st.kartaTytul ? '<div class="hero__karta"><strong>' + esc(st.kartaTytul) + "</strong><span>" + esc(st.kartaOpis) + "</span></div>" : "") + "</div></div></section>";
  }
  var pr = aktywne(S.promocje);
  if (pr.length) h += sekcja("promocje", "sekcja--stal", naglowek("promocje") + '<div class="promocje">' + pr.map(kartaPromocji).join("") + "</div>");
  h += sekcja("wyrozniki", "", naglowek("wyrozniki") + '<div class="wyrozniki">' + widoczne(S.wyrozniki).map(function (w) { return '<div class="wyroznik">' + ico(w.ikona) + "<h3>" + esc(w.tytul) + "</h3><p>" + fmtLinia(w.opis) + "</p></div>"; }).join("") + "</div>");
  var pol = widoczne(S.uslugi).filter(function (u) { return u.glowna; });
  h += sekcja("polecane", pr.length ? "" : "sekcja--stal", naglowek("polecane") + '<div class="uslugi-siatka">' + pol.map(kartaUslugi).join("") + '</div><div class="centr mt"><a class="btn btn--ciemny" href="#uslugi">Wszystkie usługi ' + ico("strzalka") + '</a><a class="btn btn--obrys" href="#cennik">Pełny cennik</a></div>');
  if (sekWidoczna("marki")) {
    var s = sek("marki");
    h += '<section class="sekcja sekcja--ciemna z-sygnalem" id="sek-marki" data-sek="marki" aria-labelledby="h-marki"><canvas class="sygnal" aria-hidden="true"></canvas><div class="wrap dwie"><div class="naglowek-sekcji" style="margin:0">' +
      (s.nadtytul ? '<span class="etykieta">' + esc(s.nadtytul) + "</span>" : "") + '<h2 id="h-marki">' + fmtLinia(s.tytul) + "</h2><p>" + fmtLinia(s.wstep) + '</p></div><ul class="marki">' +
      widoczne(S.marki).map(function (m) { return "<li><strong>" + esc(m.nazwa) + "</strong><span>" + esc(m.opis) + "</span></li>"; }).join("") + "</ul></div></section>";
  }
  h += sekcja("kroki", "", naglowek("kroki") + '<ol class="kroki czeka">' + widoczne(S.kroki).map(function (k, i) { return '<li style="--i:' + i + '"><h3>' + esc(k.tytul) + '</h3><p style="color:var(--tekst-2)">' + fmtLinia(k.opis) + "</p></li>"; }).join("") + "</ol>");
  var ak = aktywne(S.aktualnosci).sort(function (a, b) { return (b.data || b.od) > (a.data || a.od) ? 1 : -1; });
  if (ak.length) h += sekcja("aktualnosci", "sekcja--stal", naglowek("aktualnosci") + '<div class="aktualnosci">' + ak.map(function (a) {
    return '<article class="wpis odslon">' + (a.zdjecie ? '<div class="usluga__foto">' + obraz(a.zdjecie, a.tytul) + "</div>" : "") + '<time datetime="' + (a.data || a.od) + '">' + dataSlownie(a.data || a.od) + "</time><h3>" + esc(a.tytul) + "</h3>" + fmt(a.tresc) + "</article>";
  }).join("") + "</div>");
  return h + htmlPasCta();
}
function widokUslugi() {
  var h = podhero("Usługi", "uslugi");
  if (sekWidoczna("uslugi")) {
    var kats = widoczne(S.kategorie).map(function (k) {
      var lista = widoczne(S.uslugi).filter(function (u) { return u.kategoria === k.id; });
      if (!lista.length) return "";
      return '<div class="kategoria"><div class="kategoria__opis"><h2>' + esc(k.nazwa) + "</h2><p>" + esc(k.opis) + '</p></div><div class="uslugi-siatka">' + lista.map(kartaUslugi).join("") + "</div></div>";
    }).join("");
    h += '<section class="sekcja" id="sek-uslugi" data-sek="uslugi" aria-label="Lista usług"><div class="wrap">' + kats + "</div></section>";
  }
  h += sekcja("pakiety", "sekcja--stal", naglowek("pakiety") + htmlPakiety());
  return h + htmlPasCta();
}
function htmlPakiety() {
  return '<div class="pakiety">' + widoczne(S.pakiety).map(function (p) {
    return '<article class="pakiet odslon' + (p.wyrozniony ? " pakiet--wyrozniony" : "") + '"><h3>' + esc(p.nazwa) + '</h3><div class="pakiet__cena">' + esc(p.cena) + " <small>" + esc(p.dopisek) + "</small></div><p>" + fmtLinia(p.opis) + '</p><ul class="lista-check">' +
      String(p.punkty || "").split("\n").filter(Boolean).map(function (t) { return "<li>" + ico("check") + "<span>" + esc(t) + "</span></li>"; }).join("") +
      '</ul><a class="btn ' + (p.wyrozniony ? "btn--glowny" : "btn--ciemny") + '" href="' + telHref() + '">Zamów telefonicznie</a></article>';
  }).join("") + "</div>";
}
function widokCennik() {
  var h = podhero("Cennik", "cennik");
  if (sekWidoczna("cennik")) {
    var tab = widoczne(S.kategorie).map(function (k) {
      var w = widoczne(S.cennik).filter(function (c) { return c.kategoria === k.id; });
      if (!w.length) return "";
      return '<div class="tabela-wrap odslon"><table><caption>' + esc(k.nazwa) + '</caption><thead><tr><th scope="col">Usługa</th><th scope="col">Czas</th><th scope="col" class="kwota">Cena brutto</th></tr></thead><tbody>' +
        w.map(function (c) { return '<tr><th scope="row">' + esc(c.nazwa) + (c.dopisek ? "<small>" + esc(c.dopisek) + "</small>" : "") + '</th><td class="czas">' + esc(c.czas || "–") + '</td><td class="kwota">' + esc(c.cena) + "</td></tr>"; }).join("") + "</tbody></table></div>";
    }).join("");
    h += '<section class="sekcja" id="sek-cennik" data-sek="cennik" aria-label="Cennik"><div class="wrap"><div class="cennik-tabele">' + tab + '</div><div class="przypis mt">' + fmt(S.cennikUwaga) + "</div></div></section>";
  }
  if (sekWidoczna("platnosci")) {
    var s = sek("platnosci");
    h += '<section class="sekcja sekcja--stal" id="sek-platnosci" data-sek="platnosci" aria-labelledby="h-platnosci"><div class="wrap dwie"><div class="naglowek-sekcji" style="margin:0"><span class="etykieta">' + esc(s.nadtytul) + '</span><h2 id="h-platnosci">' + fmtLinia(s.tytul) + "</h2>" + (s.wstep ? "<p>" + fmtLinia(s.wstep) + "</p>" : "") + '</div><ul class="lista-check">' +
      "<li>" + ico("karta") + "<span><strong>Płatności:</strong> " + fmtLinia(S.info.platnosci) + "</span></li><li>" + ico("tarcza") + "<span><strong>Gwarancja:</strong> " + fmtLinia(S.info.gwarancja) + "</span></li></ul></div></section>";
  }
  h += sekcja("faq", "", naglowek("faq") + '<div class="faq">' + widoczne(S.faq).map(function (f) { return "<details><summary>" + esc(f.pytanie) + "</summary>" + fmt(f.odpowiedz).replace(/<p>/g, "<p>") + "</details>"; }).join("") + "</div>");
  return h + htmlPasCta();
}
function widokONas() {
  var o = S.onas, h = "";
  h += '<section class="podhero"><div class="wrap"><p class="okruszki"><a href="#start">Start</a> / O nas</p><span class="etykieta">' + esc(o.nadtytul) + "</span><h1>" + fmtLinia(o.tytul) + "</h1><p>" + fmtLinia(o.wstep) + "</p></div></section>";
  if (sekWidoczna("onas")) h += '<section class="sekcja" id="sek-onas" data-sek="onas" aria-labelledby="h-onas"><div class="wrap dwie"><div style="display:grid;gap:1.1rem"><span class="etykieta">Nasza historia</span><h2 id="h-onas">' + fmtLinia(o.naglowek) + '</h2><div class="tekst-bogaty">' + fmt(o.tekst) + "</div></div>" +
    '<div style="display:grid;gap:12px">' + foto(o.zdjecie1, "Warsztat Szalone auto", o.zdjecie1 ? "" : "Miejsce na zdjęcie warsztatu", "", "aspect-ratio:4/3;border-radius:6px") + foto(o.zdjecie2, "Wnętrze warsztatu", "Zdjęcie: wnętrze warsztatu (img/o-nas.jpg)", "", "aspect-ratio:16/9;border-radius:6px") + "</div></div></section>";
  h += sekcja("zespol", "sekcja--stal", naglowek("zespol") + '<div class="zespol">' + widoczne(S.zespol).map(function (z) {
    var ini = z.imie.split(" ").map(function (x) { return x[0]; }).join("").slice(0, 2);
    return '<div class="osoba odslon"><figure class="foto">' + (z.zdjecie ? obraz(z.zdjecie, "Portret: " + z.imie) : "") + '<span class="monogram" aria-hidden="true">' + esc(ini) + "</span></figure><h3>" + esc(z.imie) + '</h3><strong style="font-size:.9rem;color:var(--mosiadz-ciemny)">' + esc(z.rola) + "</strong><span>" + esc(z.opis) + "</span></div>";
  }).join("") + "</div>");
  if (sekWidoczna("galeria")) {
    var g = widoczne(S.galeria), kat = [];
    g.forEach(function (x) { if (x.kategoria && kat.indexOf(x.kategoria) < 0) kat.push(x.kategoria); });
    var filtry = kat.length > 1 ? '<div class="filtry" role="group" aria-label="Filtruj galerię"><button type="button" class="filtr" data-filtr="" aria-pressed="true">Wszystkie</button>' + kat.map(function (k) { return '<button type="button" class="filtr" data-filtr="' + esc(k) + '" aria-pressed="false">' + esc(k) + "</button>"; }).join("") + "</div>" : "";
    h += sekcja("galeria", "", naglowek("galeria") + filtry + '<div class="galeria">' + g.map(function (x, i) {
      return '<button type="button" class="foto' + (i === 0 ? " foto--duze" : "") + '" data-kat="' + esc(x.kategoria || "") + '" data-lb="' + i + '" aria-label="Powiększ: ' + esc(x.podpis || "zdjęcie " + (i + 1)) + '">' + obraz(x.zdjecie, x.podpis) + (x.podpis ? '<span class="podpis">' + esc(x.podpis) + "</span>" : "") + "</button>";
    }).join("") + "</div>");
  }
  if (sekWidoczna("czesci")) {
    var s = sek("czesci");
    h += '<section class="sekcja sekcja--ciemna" id="sek-czesci" data-sek="czesci" aria-labelledby="h-czesci"><div class="wrap dwie"><div class="naglowek-sekcji" style="margin:0"><span class="etykieta">' + esc(s.nadtytul) + '</span><h2 id="h-czesci">' + fmtLinia(s.tytul) + "</h2><p>" + fmtLinia(s.wstep) + '</p></div><ul class="lista-check">' +
      widoczne(S.czesci).map(function (c) { return "<li>" + ico("check") + "<span>" + fmtLinia(c.tekst) + "</span></li>"; }).join("") + "</ul></div></section>";
  }
  if (sekWidoczna("opinie")) {
    var op = widoczne(S.opinie), link = S.kontakt.googleOpinie;
    var btn = '<a class="btn btn--ciemny" href="' + (link ? esc(link) : "#kontakt") + '"' + (link ? ' target="_blank" rel="noopener"' : "") + ">" + ico("gwiazda") + "Opinie w Google</a>";
    var tresc;
    if (op.length) {
      var sr = op.reduce(function (a, b) { return a + (+b.ocena || 5); }, 0) / op.length;
      tresc = '<div class="oceny"><span class="oceny__srednia">' + sr.toFixed(1).replace(".", ",") + "</span><div>" + gwiazdki(Math.round(sr)) + '<div style="color:var(--tekst-2);font-size:.92rem">' + op.length + " " + (op.length === 1 ? "opinia" : op.length < 5 ? "opinie" : "opinii") + " na stronie</div></div>" + btn + '</div><div class="opinie">' +
        op.map(function (x) { return '<blockquote class="opinia opinia--prawdziwa odslon">' + gwiazdki(+x.ocena || 5) + fmt(x.tresc) + "<footer>" + esc(x.autor) + (x.usluga ? " · " + esc(x.usluga) : "") + "</footer></blockquote>"; }).join("") + "</div>";
    } else {
      tresc = '<div class="brak-opinii"><p>Opinie naszych klientów zbieramy w wizytówce Google. Zapraszamy do przeczytania i podzielenia się swoją opinią po wizycie.</p>' + btn + "</div>";
    }
    h += sekcja("opinie", "", naglowek("opinie") + tresc);
  }
  return h + htmlPasCta();
}
function widokKontakt() {
  var k = S.kontakt, st = stanOtwarcia(), h = podhero("Kontakt i dojazd", "kontakt");
  if (sekWidoczna("kontakt")) h += '<section class="sekcja" id="sek-kontakt" data-sek="kontakt" aria-label="Kontakt i godziny"><div class="wrap"><div class="kontakt-siatka">' +
    '<div class="kafel kafel--ciemny"><h3>Telefon – umówienie wizyty</h3><a class="duzy-numer" href="' + telHref() + '">' + esc(k.telefon) + '</a><div class="akcje"><a class="btn btn--glowny" href="' + telHref() + '">' + ico("tel") + 'Zadzwoń</a><a class="btn btn--obrys" href="' + smsHref() + '">' + ico("sms") + "SMS</a></div>" +
    '<p style="color:var(--na-ciemnym-2)">E-mail: <a href="mailto:' + esc(k.email) + '" style="color:var(--bialy)">' + esc(k.email) + "</a></p></div>" +
    '<div class="kafel"><h3>Godziny otwarcia</h3><span class="status-duzy" data-status data-stan="' + st.stan + '"><i></i><span>' + st.tekst + "</span></span>" + tabelaGodzin() + htmlZmiany() + "</div></div></div></section>";
  if (sekWidoczna("dojazd")) {
    var s = sek("dojazd");
    h += '<section class="sekcja sekcja--stal" id="sek-dojazd" data-sek="dojazd" aria-labelledby="h-dojazd"><div class="wrap dwie"><div style="display:grid;gap:1.2rem"><span class="etykieta">' + esc(s.nadtytul) + '</span><h2 id="h-dojazd">' + (s.tytul ? fmtLinia(s.tytul) : esc(adresPelny())) + "</h2>" + (s.wstep ? "<p>" + fmtLinia(s.wstep) + "</p>" : "") + (k.dzielnica ? "<p>Dzielnica: " + esc(k.dzielnica) + "</p>" : "") +
      '<ul class="lista-check"><li>' + ico("parking") + "<span><strong>Parking:</strong> " + fmtLinia(S.info.parking) + "</span></li><li>" + ico("pin") + "<span><strong>Komunikacja miejska:</strong> " + fmtLinia(S.info.komunikacja) + "</span></li><li>" + ico("dostep") + "<span><strong>Dostępność:</strong> " + fmtLinia(S.info.dostepnosc) + "</span></li><li>" + ico("zegar") + "<span><strong>Odbiór auta:</strong> " + fmtLinia(S.info.odbior) + "</span></li></ul>" +
      '<div class="centr"><a class="btn btn--ciemny" href="' + mapaLink() + '" target="_blank" rel="noopener">' + ico("pin") + "Wyznacz trasę w Google Maps</a></div></div>" +
      '<div class="mapa"><svg class="trasa" viewBox="0 0 400 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g stroke="#2E323B" stroke-width="10" fill="none"><path d="M-10 90H420M-10 250H420M120 -10V350M300 -10V350M-10 30 420 330"/></g>' +
      '<path class="trasa-anim" d="M-10 250H200A40 40 0 0 0 200 170H170A40 40 0 0 1 170 90H300" stroke="#C9A35B" stroke-width="4" fill="none" stroke-linecap="round"/><g class="pinezka"><path d="M300 90c0-14-22-14-22 0 0 10 11 22 11 22s11-12 11-22z" transform="translate(11 -24)" fill="#C9A35B"/></g></svg>' +
      '<div class="mapa__info"><strong>' + esc(S.firma.nazwa) + "</strong><span>" + esc(adresPelny()) + '</span><button class="btn btn--glowny" type="button" data-pokaz-mape>' + ico("pin") + 'Pokaż mapę Google</button><small style="color:var(--na-ciemnym-2)">Mapa ładuje się po kliknięciu.</small></div></div></div></section>';
  }
  if (sekWidoczna("wycena")) {
    var s2 = sek("wycena");
    var opcje = widoczne(S.uslugi).map(function (u) { return '<option value="' + esc(u.nazwa) + '"' + (preselectUsluga === u.id ? " selected" : "") + ">" + esc(u.nazwa) + "</option>"; }).join("") + "<option>Inna / nie wiem</option>";
    h += '<section class="sekcja" id="sek-wycena" data-sek="wycena" aria-labelledby="h-wycena"><div class="wrap dwie"><div style="display:grid;gap:1rem"><span class="etykieta">' + esc(s2.nadtytul) + '</span><h2 id="h-wycena">' + fmtLinia(s2.tytul) + '</h2><p style="color:var(--tekst-2)">' + fmtLinia(s2.wstep) + '</p><p style="color:var(--tekst-2)">Najszybciej: telefon <a href="' + telHref() + '">' + esc(k.telefon) + "</a>.</p></div>" +
      '<form class="formularz" id="form-wycena" novalidate><div class="pola"><div class="pole"><label for="w-marka">Marka *</label><input id="w-marka" required placeholder="np. BMW"></div><div class="pole"><label for="w-model">Model *</label><input id="w-model" required placeholder="np. 320d F30"></div>' +
      '<div class="pole"><label for="w-rok">Rok produkcji</label><input id="w-rok" inputmode="numeric" pattern="[0-9]{4}" placeholder="np. 2017"></div><div class="pole"><label for="w-usluga">Usługa</label><select id="w-usluga">' + opcje + "</select></div></div>" +
      '<div class="pole"><label for="w-opis">Opis problemu</label><textarea id="w-opis" placeholder="Co się dzieje z autem? Od kiedy?"></textarea></div><div class="pola"><div class="pole"><label for="w-imie">Imię *</label><input id="w-imie" required autocomplete="given-name"></div><div class="pole"><label for="w-tel">Telefon *</label><input id="w-tel" type="tel" required autocomplete="tel"></div></div>' +
      '<fieldset class="pole" style="border:0;padding:0;margin:0"><legend style="font-weight:700;margin-bottom:.35rem">Wyślij jako</legend><div class="akcje"><label class="zgoda" style="color:var(--tekst)"><input type="radio" name="kanal" value="sms" id="k-sms" checked><span>SMS</span></label><label class="zgoda" style="color:var(--tekst)"><input type="radio" name="kanal" value="email" id="k-mail"><span>E-mail</span></label></div></fieldset>' +
      '<label class="zgoda" for="w-zgoda"><input type="checkbox" id="w-zgoda" required><span>Zgadzam się na kontakt w sprawie wyceny.</span></label><button class="btn btn--ciemny" type="submit">Przygotuj wiadomość ' + ico("strzalka") + '</button><p class="komunikat" id="w-wynik" role="status" hidden></p></form></div></section>';
  }
  return h;
}

/* ---------- render główny + zachowania ---------- */
var WIDOKI_FN = { start: widokStart, uslugi: widokUslugi, cennik: widokCennik, "o-nas": widokONas, kontakt: widokKontakt };
function render(opcje) {
  opcje = opcje || {};
  var app = document.getElementById("app"), y = window.scrollY;
  app.innerHTML = htmlTopbar() + htmlHeader() + '<main id="tresc" class="' + (opcje.animuj ? "widok-wejscie" : "") + '">' + WIDOKI_FN[WIDOK]() + "</main>" + htmlStopka();
  document.title = S.firma.nazwa + " – " + (WIDOK === "start" ? "warsztat samochodowy " + S.kontakt.miasto + " | BMW, Audi, Toyota" : WIDOKI.filter(function (w) { return w[0] === WIDOK; })[0][1] + " | warsztat " + S.kontakt.miasto);
  if (opcje.zachowajScroll) window.scrollTo(0, y);
  poRenderze();
}
function trasa(hash, przewin) {
  var h = (hash || "").replace(/^#/, "") || "start", cel = null;
  if (WIDOKI_FN[h]) { WIDOK = h; }
  else {
    var s = S.sekcje.filter(function (x) { return x.id === h; })[0];
    if (s) { WIDOK = s.widok; cel = "sek-" + h; }
    else if (h.indexOf("usluga-") === 0) { WIDOK = "uslugi"; cel = h; }
    else if (h === "tresc") { return; }
  }
  render({ animuj: true });
  var el = cel && document.getElementById(cel);
  if (el) { setTimeout(function () { el.scrollIntoView({ behavior: przewin === false ? "auto" : "smooth", block: "start" }); }, 30); }
  else window.scrollTo(0, 0);
}

var licznikPaska = 0, slajdNr = 0;
function poRenderze() {
  var btn = document.querySelector(".menu-btn"), nav = document.getElementById("nawigacja");
  if (btn) btn.addEventListener("click", function () { var o = nav.classList.toggle("otwarte"); btn.setAttribute("aria-expanded", o ? "true" : "false"); });
  document.querySelectorAll('#app a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var h = a.getAttribute("href"); if (h === "#") return;
      e.preventDefault();
      if (a.dataset.usluga) preselectUsluga = a.dataset.usluga;
      if (location.hash !== h) history.pushState(null, "", h);
      trasa(h);
    });
  });
  // slider
  slajdNr = 0;
  document.querySelectorAll(".kropki button").forEach(function (b) { b.addEventListener("click", function () { pokazSlajd(+b.dataset.slajd); }); });
  // galeria
  document.querySelectorAll(".filtr").forEach(function (f) {
    f.addEventListener("click", function () {
      document.querySelectorAll(".filtr").forEach(function (x) { x.setAttribute("aria-pressed", x === f ? "true" : "false"); });
      var k = f.dataset.filtr;
      document.querySelectorAll(".galeria [data-kat]").forEach(function (el) { el.hidden = !!k && el.dataset.kat !== k; });
      var pierwszy = document.querySelector(".galeria [data-kat]:not([hidden])");
      document.querySelectorAll(".galeria [data-kat]").forEach(function (el) { el.classList.toggle("foto--duze", el === pierwszy); });
    });
  });
  document.querySelectorAll("[data-lb]").forEach(function (b) { b.addEventListener("click", function () { otworzLightbox(b); }); });
  // mapa
  var mb = document.querySelector("[data-pokaz-mape]");
  if (mb) mb.addEventListener("click", function () {
    var f = document.createElement("iframe");
    f.src = "https://www.google.com/maps?q=" + encodeURIComponent(S.kontakt.adres + ", " + S.kontakt.miasto) + "&output=embed";
    f.title = "Mapa dojazdu"; f.loading = "lazy"; mb.closest(".mapa").appendChild(f);
  });
  // formularze
  var form = document.getElementById("form-wycena");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault(); if (!form.reportValidity()) return;
    var v = function (id) { return (document.getElementById(id).value || "").trim(); };
    var tresc = "Zapytanie o wycenę – " + v("w-marka") + " " + v("w-model") + (v("w-rok") ? " (" + v("w-rok") + ")" : "") + ". Usługa: " + v("w-usluga") + ". " + v("w-opis") + " Kontakt: " + v("w-imie") + ", tel. " + v("w-tel");
    var out = document.getElementById("w-wynik"); out.hidden = false;
    out.textContent = "Przygotowaliśmy wiadomość z Pana/Pani zapytaniem – wystarczy ją wysłać. Oddzwonimy z wyceną w godzinach pracy warsztatu.";
    var email = form.querySelector("[name=kanal]:checked").value === "email";
    window.location.href = email ? "mailto:" + S.kontakt.email + "?subject=" + encodeURIComponent("Wycena: " + v("w-marka") + " " + v("w-model")) + "&body=" + encodeURIComponent(tresc) : smsHref(tresc);
  });
  document.querySelectorAll("[data-newsletter]").forEach(function (f) {
    f.addEventListener("submit", function (e) { e.preventDefault(); if (!f.reportValidity()) return; var k = f.querySelector(".komunikat"); k.hidden = false; k.textContent = "Dziękujemy za zapis. Raz w miesiącu wyślemy przypomnienia sezonowe i promocje."; f.reset(); });
  });
  document.querySelectorAll("[data-cms-otworz]").forEach(function (b) { b.addEventListener("click", function () { cmsWejdz(b); }); });
  // odsłanianie przy przewijaniu (treść widoczna od początku – przesuwa się tylko o kilka pikseli)
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (wpisy) { wpisy.forEach(function (w) { if (w.isIntersecting) { w.target.classList.remove("czeka"); io.unobserve(w.target); } }); }, { rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".odslon, .kroki").forEach(function (el) { if (el.getBoundingClientRect().top > innerHeight) el.classList.add("czeka"); else el.classList.remove("czeka"); io.observe(el); });
  } else document.querySelectorAll(".czeka").forEach(function (el) { el.classList.remove("czeka"); });
  licznikPaska = 0;
}
function pokazSlajd(n) {
  var sl = document.querySelectorAll(".slajd"); if (sl.length < 2) return;
  slajdNr = (n + sl.length) % sl.length;
  sl.forEach(function (s, i) { s.classList.toggle("on", i === slajdNr); });
  document.querySelectorAll(".kropki button").forEach(function (b, i) { b.setAttribute("aria-current", i === slajdNr ? "true" : "false"); });
}
function odswiezStatus() {
  var st = stanOtwarcia();
  document.querySelectorAll("[data-status]").forEach(function (el) { el.setAttribute("data-stan", st.stan); el.querySelector("span").textContent = st.tekst; });
  document.querySelectorAll("[data-odliczanie]").forEach(function (el) { el.textContent = pozostalo(el.getAttribute("data-odliczanie")); });
}
var ruchOgr = matchMedia("(prefers-reduced-motion: reduce)");
setInterval(function () {
  var el = document.querySelectorAll(".ticker__el"); if (el.length < 2 || document.hidden) return;
  var stary = licznikPaska % el.length; licznikPaska++; var nowy = licznikPaska % el.length;
  el[stary].classList.remove("on"); el[stary].classList.add("off");
  el[nowy].classList.remove("off"); el[nowy].classList.add("on");
  setTimeout(function () { el[stary] && el[stary].classList.remove("off"); }, 600);
  var l = document.querySelector("[data-ticker-licz]"); if (l) l.textContent = (nowy + 1) + "/" + el.length;
}, 5000);
setInterval(function () { if (!document.hidden && !ruchOgr.matches && !document.querySelector(".slider:hover")) pokazSlajd(slajdNr + 1); }, 6000);
setInterval(odswiezStatus, 60000);

/* Sygnał diagnostyczny (canvas) – delikatne przebiegi w tle sekcji „Specjalizacja” */
(function petla() {
  var t0 = performance.now();
  function klatka(t) {
    var c = document.querySelector(".sygnal");
    if (c && !ruchOgr.matches && !document.hidden) {
      var r = c.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        var dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        var x = c.getContext("2d"), s = (t - t0) / 1000;
        x.clearRect(0, 0, w, h);
        [[0.62, "rgba(201,163,91,.55)", 1.6, 0], [0.7, "rgba(163,169,179,.25)", 1, 2.1]].forEach(function (cfg) {
          x.beginPath(); x.lineWidth = cfg[2] * dpr; x.strokeStyle = cfg[1];
          for (var px = 0; px <= w; px += 4 * dpr) {
            var u = px / w * 18 + s * 1.3 + cfg[3];
            var y = h * cfg[0] + Math.sin(u) * 18 * dpr + Math.sin(u * 3.1) * 6 * dpr * (Math.sin(u / 4) > .6 ? 1 : .2);
            px === 0 ? x.moveTo(px, y) : x.lineTo(px, y);
          }
          x.stroke();
        });
      }
    }
    requestAnimationFrame(klatka);
  }
  requestAnimationFrame(klatka);
})();

/* Lightbox galerii */
var lbLista = [], lbNr = 0, lbPowrot = null;
function otworzLightbox(btn) {
  lbPowrot = btn;
  var wid = Array.prototype.slice.call(document.querySelectorAll(".galeria [data-lb]:not([hidden])"));
  lbLista = wid.map(function (b) { return widoczne(S.galeria)[+b.dataset.lb]; });
  lbNr = wid.indexOf(btn);
  var d = document.createElement("div");
  d.className = "lightbox"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Powiększone zdjęcie");
  d.innerHTML = '<div class="lightbox__gora"><span data-lb-licz></span><button type="button" class="lightbox__x" aria-label="Zamknij">×</button></div><div class="lightbox__obraz" data-lb-obraz></div><div class="lightbox__dol" data-lb-podpis></div>';
  document.body.appendChild(d);
  d.querySelector(".lightbox__x").addEventListener("click", zamknijLightbox);
  d.addEventListener("click", function (e) { if (e.target === d || e.target.hasAttribute("data-lb-obraz")) zamknijLightbox(); });
  rysujLightbox(); d.querySelector(".lightbox__x").focus();
  document.addEventListener("keydown", klawiszeLightbox);
}
function rysujLightbox() {
  var d = document.querySelector(".lightbox"), x = lbLista[lbNr]; if (!d || !x) return;
  d.querySelector("[data-lb-obraz]").innerHTML = (lbLista.length > 1 ? '<button type="button" class="lightbox__nav lightbox__nav--l" aria-label="Poprzednie">' + ico("strzalka") + "</button>" : "") + (String(x.zdjecie).indexOf("bp:") === 0 ? grafika(x.zdjecie.slice(3), "anim") : obraz(x.zdjecie, x.podpis)) + (lbLista.length > 1 ? '<button type="button" class="lightbox__nav lightbox__nav--p" aria-label="Następne">' + ico("strzalka") + "</button>" : "");
  d.querySelector("[data-lb-licz]").textContent = (lbNr + 1) + "/" + lbLista.length;
  d.querySelector("[data-lb-podpis]").textContent = x.podpis || "";
  var l = d.querySelector(".lightbox__nav--l"), p = d.querySelector(".lightbox__nav--p");
  if (l) l.addEventListener("click", function (e) { e.stopPropagation(); lbNr = (lbNr - 1 + lbLista.length) % lbLista.length; rysujLightbox(); });
  if (p) p.addEventListener("click", function (e) { e.stopPropagation(); lbNr = (lbNr + 1) % lbLista.length; rysujLightbox(); });
}
function klawiszeLightbox(e) {
  if (e.key === "Escape") zamknijLightbox();
  else if (e.key === "ArrowRight") { lbNr = (lbNr + 1) % lbLista.length; rysujLightbox(); }
  else if (e.key === "ArrowLeft") { lbNr = (lbNr - 1 + lbLista.length) % lbLista.length; rysujLightbox(); }
  else if (e.key === "Tab") { var f = document.querySelectorAll(".lightbox button"); if (f.length) { var i = Array.prototype.indexOf.call(f, document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); } }
}
function zamknijLightbox() { var d = document.querySelector(".lightbox"); if (d) d.remove(); document.removeEventListener("keydown", klawiszeLightbox); if (lbPowrot) lbPowrot.focus(); }

window.addEventListener("popstate", function () { trasa(location.hash, false); });
document.addEventListener("keydown", function (e) {
  var nav = document.getElementById("nawigacja"), b = document.querySelector(".menu-btn");
  if (e.key === "Escape" && nav && nav.classList.contains("otwarte")) { nav.classList.remove("otwarte"); b.setAttribute("aria-expanded", "false"); b.focus(); }
});
