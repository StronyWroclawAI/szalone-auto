/* =====================================================================
   3) PANEL ADMINISTRATORA (CMS)
   ===================================================================== */
var CMS = { strona: "pulpit", filtry: { promocje: "wszystkie", aktualnosci: "wszystkie" }, powrot: null, otwarteSekcje: {} };
var ZNAK_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="12" fill="#22252C"/><g transform="translate(8 8) scale(.75)" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="9"><path d="M8 52H38A11 11 0 0 0 38 30H26A11 11 0 0 1 26 8H40" stroke="#fff"/><path d="M50 8H56" stroke="#C9A35B"/></g></svg>';

function zalogowany() { try { return sessionStorage.getItem("cmsp-sesja") === "1"; } catch (e) { return !!window.__cmsSesja; } }
function ustawSesje(v) { try { v ? sessionStorage.setItem("cmsp-sesja", "1") : sessionStorage.removeItem("cmsp-sesja"); } catch (e) { } window.__cmsSesja = v; }
function odswiezKlodke() {
  var k = document.getElementById("cms-klodka"); if (!k) return;
  k.innerHTML = ico("klodka") + (zalogowany() ? "<span>Panel</span>" : '<span class="sr">Panel administratora – zaloguj</span>');
  k.setAttribute("aria-label", zalogowany() ? "Otwórz panel administratora" : "Panel administratora – zaloguj się");
}
function cmsWejdz(wyzwalacz) { CMS.powrot = wyzwalacz || document.activeElement; zalogowany() ? otworzPanel() : pokazLogowanie(); }

/* ---------- logowanie ---------- */
function pokazLogowanie() {
  var d = document.createElement("div");
  d.className = "cmsp-login"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-labelledby", "cmsp-login-t");
  d.innerHTML = '<form novalidate><div class="cmsp-login__znak">' + ZNAK_SVG + '<div><h2 id="cmsp-login-t">Panel administratora</h2><small style="color:#565C66">' + esc(S.firma.nazwa) + '</small></div></div>' +
    '<label>Login<input type="text" id="cmsp-l" autocomplete="username" required></label><label>Hasło<input type="password" id="cmsp-h" autocomplete="current-password" required></label>' +
    '<p class="cmsp-blad" role="alert" hidden>Nieprawidłowy login lub hasło.</p><div class="cmsp-btny"><button type="button" class="cmsp-btn" data-anuluj>Anuluj</button><button type="submit" class="cmsp-btn cmsp-btn--ciem">Zaloguj</button></div>' +
    '<p class="cmsp-podp">Wersja demonstracyjna · login <b>' + CMS_LOGIN + "</b>, hasło <b>" + CMS_HASLO + "</b></p></form>";
  document.body.appendChild(d);
  var f = d.querySelector("form"), zamknij = function () { d.remove(); document.removeEventListener("keydown", esc1); if (CMS.powrot && CMS.powrot.focus) CMS.powrot.focus(); };
  var esc1 = function (e) { if (e.key === "Escape") zamknij(); };
  document.addEventListener("keydown", esc1);
  d.querySelector("[data-anuluj]").addEventListener("click", zamknij);
  d.addEventListener("click", function (e) { if (e.target === d) zamknij(); });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    if (d.querySelector("#cmsp-l").value.trim() === CMS_LOGIN && d.querySelector("#cmsp-h").value === CMS_HASLO) {
      ustawSesje(true); d.remove(); document.removeEventListener("keydown", esc1); odswiezKlodke(); otworzPanel(); toast("Zalogowano. Zmiany zapisują się automatycznie.");
    } else { var b = d.querySelector(".cmsp-blad"); b.hidden = false; d.querySelector("#cmsp-h").select(); }
  });
  setTimeout(function () { d.querySelector("#cmsp-l").focus(); }, 20);
}
function wyloguj() { ustawSesje(false); zamknijPanel(); odswiezKlodke(); toast("Wylogowano."); }

/* ---------- toasty ---------- */
function toast(t, blad) {
  var w = document.querySelector(".cmsp-toasty");
  if (!w) { w = document.createElement("div"); w.className = "cmsp-toasty"; w.setAttribute("role", "status"); w.setAttribute("aria-live", "polite"); document.body.appendChild(w); }
  var el = document.createElement("div"); el.className = "cmsp-toast" + (blad ? " cmsp-toast--blad" : ""); el.textContent = t;
  w.appendChild(el); setTimeout(function () { el.remove(); }, 3200);
}

/* ---------- ścieżki danych ---------- */
function pobierz(sc) { return sc.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, S); }
function ustaw(sc, v) { var p = sc.split("."), o = S; for (var i = 0; i < p.length - 1; i++) o = o[p[i]]; o[p[p.length - 1]] = v; }

/* ---------- konfiguracja kolekcji ---------- */
function opcjeKategorii() { return S.kategorie.map(function (k) { return [k.id, k.nazwa]; }); }
function opcjeUslug() { return [["", "– brak –"]].concat(S.uslugi.map(function (u) { return [u.id, u.nazwa]; })); }
function nazwaKat(id) { var k = S.kategorie.filter(function (x) { return x.id === id; })[0]; return k ? k.nazwa : "bez kategorii"; }
function nazwaUslugi(id) { var u = S.uslugi.filter(function (x) { return x.id === id; })[0]; return u ? u.nazwa : ""; }
function zakres(it) { return (it.od ? dataKrotko(it.od) : "od zawsze") + " – " + (it.do ? dataKrotko(it.do) + "." + it.do.slice(0, 4) : "bez końca"); }
var POLA_CZASOWE = [{ k: "od", l: "Pokazuj od", t: "date" }, { k: "do", l: "Pokazuj do", t: "date", pomoc: "Puste = bez końca" }, { k: "naPasku", l: "Pokaż też na górnym pasku komunikatów", t: "check" }, { k: "wstrzymana", l: "Wstrzymaj (nie pokazuj na stronie)", t: "check" }];
var KOL = {
  promocje: { t: "Promocje", j: "promocję", sek: "promocje", czasowa: true, mini: "zdjecie",
    pola: [{ k: "tytul", l: "Tytuł", t: "text", wym: true, pelne: true }, { k: "opis", l: "Opis", t: "textarea", fmt: true, pelne: true }, { k: "plakietka", l: "Plakietka", t: "text", pomoc: "np. −15%, od 199 zł, Gratis" }, { k: "usluga", l: "Powiązana usługa", t: "select", opcje: opcjeUslug, pomoc: "Na karcie tej usługi pojawi się plakietka promocji" }, { k: "zdjecie", l: "Zdjęcie", t: "image", pelne: true }].concat(POLA_CZASOWE),
    pods: function (x) { return zakres(x) + (x.plakietka ? " · " + x.plakietka : "") + (x.usluga ? " · " + nazwaUslugi(x.usluga) : ""); } },
  aktualnosci: { t: "Aktualności", j: "aktualność", sek: "aktualnosci", czasowa: true, mini: "zdjecie",
    pola: [{ k: "tytul", l: "Tytuł", t: "text", wym: true, pelne: true }, { k: "tresc", l: "Treść", t: "textarea", fmt: true, pelne: true }, { k: "data", l: "Data wpisu", t: "date" }, { k: "zdjecie", l: "Zdjęcie", t: "image", pelne: true }].concat(POLA_CZASOWE),
    pods: function (x) { return (x.data ? dataKrotko(x.data) + " · " : "") + "widoczna " + zakres(x); } },
  uslugi: { t: "Usługi", j: "usługę", sek: "uslugi", mini: "ikona",
    pola: [{ k: "nazwa", l: "Nazwa usługi", t: "text", wym: true, pelne: true }, { k: "kategoria", l: "Kategoria", t: "select", opcje: opcjeKategorii }, { k: "ikona", l: "Ikona", t: "select", opcje: function () { return IKONY_USLUG; } }, { k: "opis", l: "Krótki opis", t: "textarea", fmt: true, pelne: true }, { k: "czas", l: "Czas", t: "text", pomoc: "np. ok. 1 h" }, { k: "cena", l: "Cena (przedział)", t: "text", pomoc: "np. 120–280 zł" }, { k: "plakietka", l: "Własna plakietka", t: "text", pomoc: "np. Polecane" }, { k: "przycisk", l: "Przycisk na karcie", t: "select", opcje: function () { return [["zadzwon", "Zadzwoń i umów"], ["wycena", "Zapytaj o wycenę (formularz)"]]; } }, { k: "nowosc", l: "Oznacz jako „Nowość”", t: "check" }, { k: "glowna", l: "Pokaż na stronie głównej", t: "check" }, { k: "zdjecie", l: "Zdjęcie (opcjonalnie)", t: "image", pelne: true }],
    pods: function (x) { return nazwaKat(x.kategoria) + " · " + (x.czas ? x.czas + " · " : "") + x.cena + (x.glowna ? " · na stronie głównej" : ""); } },
  kategorie: { t: "Kategorie usług", j: "kategorię", sek: "uslugi", pola: [{ k: "nazwa", l: "Nazwa", t: "text", wym: true, pelne: true }, { k: "opis", l: "Opis", t: "textarea", pelne: true }],
    pods: function (x) { var n = S.uslugi.filter(function (u) { return u.kategoria === x.id; }).length, c = S.cennik.filter(function (u) { return u.kategoria === x.id; }).length; return n + " usł. · " + c + " poz. cennika"; } },
  cennik: { t: "Cennik", j: "pozycję cennika", sek: "cennik", pola: [{ k: "kategoria", l: "Kategoria (osobna tabela na stronie)", t: "select", opcje: opcjeKategorii, pelne: true }, { k: "nazwa", l: "Nazwa", t: "text", wym: true, pelne: true }, { k: "dopisek", l: "Dopisek", t: "text" }, { k: "czas", l: "Czas", t: "text" }, { k: "cena", l: "Cena", t: "text", pomoc: "np. 120–160 zł albo od 300 zł" }],
    pods: function (x) { return nazwaKat(x.kategoria) + (x.czas ? " · " + x.czas : "") + " · " + x.cena; } },
  pakiety: { t: "Pakiety", j: "pakiet", sek: "pakiety", pola: [{ k: "nazwa", l: "Nazwa", t: "text", wym: true }, { k: "cena", l: "Cena", t: "text" }, { k: "dopisek", l: "Dopisek przy cenie", t: "text", pomoc: "np. brutto / sezon" }, { k: "wyrozniony", l: "Wyróżnij (ciemna karta)", t: "check" }, { k: "opis", l: "Opis", t: "textarea", pelne: true }, { k: "punkty", l: "Co zawiera", t: "textarea", pelne: true, pomoc: "Jeden punkt w jednej linii" }],
    pods: function (x) { return x.cena + " " + x.dopisek + (x.wyrozniony ? " · wyróżniony" : ""); } },
  slider: { t: "Zdjęcia slidera", j: "zdjęcie", sek: "hero", mini: "zdjecie", pola: [{ k: "zdjecie", l: "Zdjęcie", t: "image", wym: true, pelne: true }, { k: "podpis", l: "Podpis", t: "text", pelne: true }], pods: function (x) { return x.podpis; } },
  atuty: { t: "Atuty pod przyciskami", j: "atut", sek: "hero", mini: "ikona", pola: [{ k: "tekst", l: "Tekst", t: "text", wym: true }, { k: "ikona", l: "Ikona", t: "select", opcje: function () { return IKONY_USLUG; } }], pods: function () { return ""; }, tytulK: "tekst" },
  wyrozniki: { t: "Wyróżniki – „Dlaczego my”", j: "wyróżnik", sek: "wyrozniki", mini: "ikona", pola: [{ k: "tytul", l: "Tytuł", t: "text", wym: true }, { k: "ikona", l: "Ikona", t: "select", opcje: function () { return IKONY_USLUG; } }, { k: "opis", l: "Opis", t: "textarea", fmt: true, pelne: true }], pods: function (x) { return x.opis; } },
  kroki: { t: "Kroki wizyty", j: "krok", sek: "kroki", pola: [{ k: "tytul", l: "Tytuł", t: "text", wym: true, pelne: true }, { k: "opis", l: "Opis", t: "textarea", fmt: true, pelne: true }], pods: function (x) { return x.opis; } },
  marki: { t: "Specjalizacja – marki", j: "markę", sek: "marki", pola: [{ k: "nazwa", l: "Marka", t: "text", wym: true }, { k: "opis", l: "W czym się specjalizujemy", t: "text" }], pods: function (x) { return x.opis; } },
  galeria: { t: "Galeria", j: "zdjęcie", sek: "galeria", mini: "zdjecie", pola: [{ k: "zdjecie", l: "Zdjęcie", t: "image", wym: true, pelne: true }, { k: "podpis", l: "Podpis", t: "text" }, { k: "kategoria", l: "Kategoria (filtr nad galerią)", t: "text", lista: function () { var a = []; S.galeria.forEach(function (g) { if (g.kategoria && a.indexOf(g.kategoria) < 0) a.push(g.kategoria); }); return a; } }],
    pods: function (x) { return (x.kategoria || "bez kategorii") + (x.podpis ? " · " + x.podpis : ""); }, tytulK: "podpis" },
  opinie: { t: "Opinie klientów", j: "opinię", sek: "opinie", pola: [{ k: "autor", l: "Autor", t: "text", wym: true }, { k: "ocena", l: "Ocena", t: "select", opcje: function () { return [["5", "★★★★★ 5"], ["4", "★★★★ 4"], ["3", "★★★ 3"]]; } }, { k: "usluga", l: "Usługa / auto", t: "text", pomoc: "np. Serwis klimatyzacji, Audi A4" }, { k: "tresc", l: "Treść opinii", t: "textarea", pelne: true, pomoc: "Wpisuj tylko prawdziwe opinie – np. skopiowane z Google za zgodą autora." }],
    pods: function (x) { return "★ " + (x.ocena || 5) + (x.usluga ? " · " + x.usluga : ""); }, tytulK: "autor" },
  faq: { t: "Najczęstsze pytania (FAQ)", j: "pytanie", sek: "faq", pola: [{ k: "pytanie", l: "Pytanie", t: "text", wym: true, pelne: true }, { k: "odpowiedz", l: "Odpowiedź", t: "textarea", fmt: true, pelne: true }], pods: function (x) { return x.odpowiedz; }, tytulK: "pytanie" },
  czesci: { t: "Części i produkty", j: "punkt", sek: "czesci", pola: [{ k: "tekst", l: "Tekst punktu", t: "text", wym: true, pelne: true, fmt: true }], pods: function () { return ""; }, tytulK: "tekst" },
  zespol: { t: "Zespół", j: "osobę", sek: "zespol", mini: "zdjecie", pola: [{ k: "imie", l: "Imię i nazwisko", t: "text", wym: true }, { k: "rola", l: "Rola", t: "text" }, { k: "opis", l: "Opis", t: "textarea", pelne: true }, { k: "zdjecie", l: "Zdjęcie (portret)", t: "image", pelne: true, pomoc: "Bez zdjęcia na stronie pojawi się monogram z inicjałów." }],
    pods: function (x) { return x.rola; }, tytulK: "imie" },
  dniSpecjalne: { t: "Dni specjalne", j: "dzień specjalny", sek: "kontakt", sortowana: true, pola: [{ k: "data", l: "Data", t: "date", wym: true }, { k: "opis", l: "Opis", t: "text", pomoc: "np. Wigilia" }, { k: "nieczynne", l: "Warsztat nieczynny", t: "check", pelne: true }, { k: "od", l: "Godzina od", t: "time" }, { k: "do", l: "Godzina do", t: "time" }],
    pods: function (x) { return (x.nieczynne ? "nieczynne" : godz(x.od) + "–" + godz(x.do)) + (x.data < dzisISO() ? " · minął" : ""); }, tytulF: function (x) { return dataSlownie(x.data) + (x.opis ? " – " + x.opis : ""); } }
};
function tytulEl(kol, x) { var c = KOL[kol]; if (c.tytulF) return c.tytulF(x); return x[c.tytulK || ["tytul", "nazwa"].filter(function (k) { return k in x; })[0] || "tytul"] || "(bez tytułu)"; }

/* ---------- menu panelu ---------- */
var MENU = [
  ["Przegląd", [["pulpit", "Pulpit"]]],
  ["Treści czasowe", [["promocje", "Promocje"], ["aktualnosci", "Aktualności"]]],
  ["Oferta", [["uslugi", "Usługi"], ["kategorie", "Kategorie usług"], ["cennik", "Cennik"], ["pakiety", "Pakiety"]]],
  ["Wizerunek", [["glowna", "Strona główna"], ["wyrozniki", "Wyróżniki"], ["kroki", "Kroki wizyty"], ["marki", "Specjalizacja – marki"], ["galeria", "Galeria"]]],
  ["Zaufanie", [["opinie", "Opinie"], ["faq", "FAQ"], ["czesci", "Części i produkty"]]],
  ["Warsztat", [["onas", "O firmie"], ["zespol", "Zespół"], ["godziny", "Godziny otwarcia"], ["kontakt", "Dane kontaktowe"], ["info", "Informacje praktyczne"]]],
  ["Ustawienia", [["sekcje", "Sekcje strony"], ["kopia", "Kopia zapasowa"]]]
];
var STRONY_SEK = { pulpit: null, glowna: "hero", onas: "onas", godziny: "kontakt", kontakt: "kontakt", info: "dojazd", sekcje: null, kopia: null };
function sekcjaStrony(s) { return s in STRONY_SEK ? STRONY_SEK[s] : (KOL[s] ? KOL[s].sek : null); }

function otworzPanel(strona) {
  if (strona) CMS.strona = strona;
  var p = document.querySelector(".cmsp");
  if (!p) {
    p = document.createElement("div"); p.className = "cmsp"; p.setAttribute("role", "dialog"); p.setAttribute("aria-modal", "true"); p.setAttribute("aria-label", "Panel administratora");
    p.innerHTML = '<header class="cmsp-top"><div class="cmsp-marka">' + ZNAK_SVG + "<div><strong>" + esc(S.firma.nazwa) + '</strong><span>Panel administratora</span></div></div><span class="cmsp-zapis" data-stan="ok" aria-live="polite"><i></i><span>Zmiany zapisują się automatycznie</span></span>' +
      '<button type="button" class="cmsp-btn cmsp-btn--duch" data-akcja="zamknij">Zobacz stronę</button><button type="button" class="cmsp-btn cmsp-btn--duch" data-akcja="wyloguj">Wyloguj</button></header>' +
      '<div class="cmsp-cialo"><nav class="cmsp-nav" aria-label="Sekcje panelu"></nav><main class="cmsp-main" tabindex="-1"></main></div>';
    document.body.appendChild(p);
    p.addEventListener("click", klikPanel);
    p.addEventListener("input", wpisPanel);
    p.addEventListener("change", zmianaPanel);
    document.documentElement.style.overflow = "hidden";
  }
  rysujNav(); rysujStrone();
  var akt = p.querySelector('.cmsp-nav [aria-current="page"]'); if (akt) akt.focus();
}
function zamknijPanel(doSekcji) {
  var p = document.querySelector(".cmsp"); if (p) p.remove();
  document.documentElement.style.overflow = "";
  if (doSekcji) {
    var s = sek(doSekcji);
    if (s.widoczna === false) toast("Ta sekcja jest wyłączona w „Sekcje strony” – na stronie jej nie widać.", true);
    if (location.hash !== "#" + doSekcji) history.pushState(null, "", "#" + doSekcji);
    trasa("#" + doSekcji);
    setTimeout(function () { if (!document.getElementById("sek-" + doSekcji) && s.widoczna !== false) toast("Sekcja jest teraz pusta, więc chowa się na stronie.", true); }, 60);
  } else if (CMS.powrot && CMS.powrot.focus && document.contains(CMS.powrot)) CMS.powrot.focus();
  else { var k = document.getElementById("cms-klodka"); if (k) k.focus(); }
}
function liczAktywne(kol) { return widoczne(S[kol]).filter(function (x) { return statusCzasowy(x) === "aktywna"; }).length; }
function rysujNav() {
  var n = document.querySelector(".cmsp-nav"); if (!n) return;
  n.innerHTML = MENU.map(function (g) {
    return "<h3>" + g[0] + "</h3>" + g[1].map(function (it) {
      var licz = "";
      if (KOL[it[0]]) licz = KOL[it[0]].czasowa ? '<span class="cmsp-liczniki"><span class="cmsp-licz cmsp-licz--ok" title="Aktywne">' + liczAktywne(it[0]) + '</span><span class="cmsp-licz" title="Wszystkie">' + S[it[0]].length + "</span></span>" : '<span class="cmsp-licz">' + S[it[0]].length + "</span>";
      if (it[0] === "godziny") licz = '<span class="cmsp-licz">' + S.dniSpecjalne.length + "</span>";
      return '<button type="button" data-akcja="idz" data-strona="' + it[0] + '"' + (CMS.strona === it[0] ? ' aria-current="page"' : "") + "><span>" + it[1] + "</span>" + licz + "</button>";
    }).join("");
  }).join("");
}
function glowa(tytul, opis, sekId, extra) {
  return '<div class="cmsp-glowa"><div><h1>' + tytul + "</h1>" + (opis ? "<p>" + opis + "</p>" : "") + '</div><div class="cmsp-szybkie">' + (extra || "") + (sekId ? '<button type="button" class="cmsp-btn" data-akcja="zobacz" data-sek="' + sekId + '">Zobacz na stronie ' + ico("strzalka") + "</button>" : "") + "</div></div>";
}
function rysujStrone() {
  var m = document.querySelector(".cmsp-main"); if (!m) return;
  var s = CMS.strona, h;
  if (s === "pulpit") h = stronaPulpit();
  else if (s === "glowna") h = stronaGlowna();
  else if (s === "onas") h = stronaONas();
  else if (s === "kontakt") h = stronaKontakt();
  else if (s === "info") h = stronaInfo();
  else if (s === "godziny") h = stronaGodziny();
  else if (s === "sekcje") h = stronaSekcje();
  else if (s === "kopia") h = stronaKopia();
  else h = stronaKolekcji(s);
  m.innerHTML = h;
  podlaczZdjecia(m);
}

/* ---------- pola formularzy ---------- */
var licznikPol = 0;
function htmlPola(f, w, opt) {
  opt = opt || {};
  var id = "cmsp-f" + (++licznikPol), atr = opt.sciezka ? ' data-sciezka="' + opt.sciezka + '"' : ' data-k="' + f.k + '"';
  var pomoc = f.pomoc ? "<small>" + esc(f.pomoc) + "</small>" : "";
  var fmtPomoc = f.fmt ? '<span class="cmsp-pomoc-fmt">Formatowanie: <code>*kursywa*</code> (kolor akcentu), <code>**pogrubienie**</code>, pusta linia = nowy akapit.</span>' : "";
  var wrap = function (wn, bezEt) { return '<div class="cmsp-pole' + (f.pelne || f.t === "textarea" ? " cmsp-pole--pelne" : "") + '">' + (bezEt ? "" : '<label for="' + id + '">' + esc(f.l) + (f.wym ? " *" : "") + ' <span class="cmsp-jezyk">PL</span></label>') + wn + pomoc + fmtPomoc + "</div>"; };
  w = w == null ? "" : w;
  if (f.t === "textarea") return wrap('<textarea id="' + id + '"' + atr + ' data-typ="text">' + esc(w) + "</textarea>");
  if (f.t === "check") return wrap('<label class="cmsp-check" for="' + id + '"><input type="checkbox" id="' + id + '"' + atr + ' data-typ="check"' + (w ? " checked" : "") + ">" + esc(f.l) + "</label>", true);
  if (f.t === "select") { var op = (typeof f.opcje === "function" ? f.opcje() : f.opcje).map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(w) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join(""); return wrap('<select id="' + id + '"' + atr + ' data-typ="text">' + op + "</select>"); }
  if (f.t === "image") {
    var bp = Object.keys(GRAFIKI).map(function (k) { return '<option value="bp:' + k + '"' + (w === "bp:" + k ? " selected" : "") + ">" + GRAFIKI[k] + "</option>"; }).join("");
    return '<div class="cmsp-pole cmsp-pole--pelne"><span class="cmsp-et">' + esc(f.l) + (f.wym ? " *" : "") + '</span><div class="cmsp-foto"><div class="cmsp-foto__podglad" data-podglad>' + (w ? obraz(w, "") : "brak zdjęcia") + "</div>" +
      '<div class="cmsp-foto__akcje"><div><span class="cmsp-btn cmsp-btn--mini cmsp-plik">Wgraj z dysku<input type="file" accept="image/*" data-wgraj aria-label="Wgraj zdjęcie z dysku"></span><button type="button" class="cmsp-btn cmsp-btn--mini" data-akcja="usun-foto">Usuń zdjęcie</button></div>' +
      '<label class="sr" for="' + id + '">Adres URL zdjęcia</label><input type="text" id="' + id + '"' + atr + ' data-typ="text" data-foto value="' + esc(String(w).indexOf("data:") === 0 ? "" : w) + '" placeholder="Adres URL zdjęcia, np. img/hero.jpg">' +
      (String(w).indexOf("data:") === 0 ? '<input type="hidden" data-foto-dane value="' + esc(w) + '">' : '<input type="hidden" data-foto-dane value="">') +
      '<select aria-label="Grafika wbudowana" data-bp><option value="">Grafika wbudowana (zamiast zdjęcia)…</option>' + bp + "</select></div></div>" + pomoc + "</div>";
  }
  var typ = { date: "date", time: "time", number: "number", email: "email", tel: "tel", url: "url" }[f.t] || "text";
  var dl = f.lista ? ' list="' + id + '-l"' : "";
  return wrap('<input type="' + typ + '" id="' + id + '"' + atr + ' data-typ="text" value="' + esc(w) + '"' + dl + ">" + (f.lista ? '<datalist id="' + id + '-l">' + f.lista().map(function (v) { return '<option value="' + esc(v) + '">'; }).join("") + "</datalist>" : ""));
}
function wartoscZdjecia(blok) {
  var dane = blok.querySelector("[data-foto-dane]").value, url = blok.querySelector("[data-foto]").value.trim();
  return dane || url;
}
function zmniejsz(plik, max, gotowe) {
  var r = new FileReader();
  r.onload = function () {
    var im = new Image();
    im.onload = function () {
      var s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      gotowe(c.toDataURL("image/jpeg", 0.82));
    };
    im.onerror = function () { toast("Nie udało się odczytać pliku. Proszę wybrać zdjęcie JPG lub PNG.", true); };
    im.src = r.result;
  };
  r.readAsDataURL(plik);
}

/* ---------- listy (kolekcje) ---------- */
function htmlListy(kol) {
  var c = KOL[kol], lista = S[kol], D = dzisISO(), filtr = CMS.filtry[kol] || "wszystkie";
  var pasek = "";
  if (c.czasowa) {
    var licz = { wszystkie: lista.length, aktywna: 0, zaplanowana: 0, zakonczona: 0, wstrzymana: 0 };
    lista.forEach(function (x) { licz[statusCzasowy(x, D)]++; });
    pasek = '<div class="cmsp-filtry" role="group" aria-label="Filtruj według statusu">' + [["wszystkie", "Wszystkie"], ["aktywna", "Aktywne"], ["zaplanowana", "Zaplanowane"], ["zakonczona", "Zakończone"], ["wstrzymana", "Wstrzymane"]].map(function (f) {
      return '<button type="button" data-akcja="filtr" data-kol="' + kol + '" data-filtr="' + f[0] + '" aria-pressed="' + (filtr === f[0]) + '">' + f[1] + " <span>" + licz[f[0]] + "</span></button>";
    }).join("") + "</div>";
  }
  var wiersze = lista.map(function (x, i) {
    if (c.czasowa && filtr !== "wszystkie" && statusCzasowy(x, D) !== filtr) return "";
    var st = c.czasowa ? statusCzasowy(x, D) : (x.ukryta ? "ukryta" : "widoczna");
    var plak = x.ukryta ? '<span class="cmsp-plak cmsp-plak--ukryta">Ukryta</span>' : '<span class="cmsp-plak cmsp-plak--' + st + '">' + (c.czasowa ? STATUS_NAZWY[st] : "Widoczna") + "</span>";
    var mini = c.mini === "zdjecie" ? (x.zdjecie ? obraz(x.zdjecie, "") : (kol === "zespol" ? esc(x.imie.split(" ").map(function (s) { return s[0]; }).join("").slice(0, 2)) : String(i + 1))) : c.mini === "ikona" ? ico(x.ikona) : String(i + 1);
    var strz = c.sortowana ? '<div class="cmsp-strzalki" aria-hidden="true"></div>' : '<div class="cmsp-strzalki"><button type="button" data-akcja="gora" data-kol="' + kol + '" data-id="' + x.id + '" aria-label="Przesuń wyżej"' + (i === 0 ? " disabled" : "") + '>▲</button><button type="button" data-akcja="dol" data-kol="' + kol + '" data-id="' + x.id + '" aria-label="Przesuń niżej"' + (i === lista.length - 1 ? " disabled" : "") + ">▼</button></div>";
    var tyt = tytulEl(kol, x);
    return '<div class="cmsp-wiersz' + (x.ukryta ? " cmsp-ukryta" : "") + '" data-wiersz="' + x.id + '">' + strz + '<div class="cmsp-mini">' + mini + '</div><div class="cmsp-wiersz__tekst"><strong>' + esc(tyt) + "</strong><span>" + esc(c.pods(x) || "") + "</span></div>" + plak +
      '<div class="cmsp-akcje"><button type="button" class="cmsp-btn cmsp-btn--mini" data-akcja="ukryj" data-kol="' + kol + '" data-id="' + x.id + '">' + (x.ukryta ? "Pokaż" : "Ukryj") + '</button><button type="button" class="cmsp-btn cmsp-btn--mini" data-akcja="duplikuj" data-kol="' + kol + '" data-id="' + x.id + '">Duplikuj</button><button type="button" class="cmsp-btn cmsp-btn--mini" data-akcja="edytuj" data-kol="' + kol + '" data-id="' + x.id + '">Edytuj</button><button type="button" class="cmsp-btn cmsp-btn--mini cmsp-btn--usun" data-akcja="usun" data-kol="' + kol + '" data-id="' + x.id + '" aria-label="Usuń: ' + esc(tyt) + '">Usuń</button></div></div>';
  }).join("");
  if (!wiersze) wiersze = '<div class="cmsp-pusto">' + (lista.length ? "Brak pozycji w tym filtrze." : "Brak pozycji. Kliknij „+ Dodaj " + c.j + "”.") + "</div>";
  return '<div class="cmsp-pasek-listy">' + pasek + '<button type="button" class="cmsp-btn cmsp-btn--gl" data-akcja="dodaj" data-kol="' + kol + '">+ Dodaj ' + c.j + '</button></div><div class="cmsp-lista" data-lista="' + kol + '">' + wiersze + "</div>";
}
var OPISY_KOL = {
  promocje: "Promocje pokazują się na stronie tylko w terminie „Pokazuj od – do”. Po terminie znikają same i zostają tu jako archiwum.",
  aktualnosci: "Komunikaty dla klientów: zmiany, nowości, przypomnienia sezonowe. Pokazują się tylko w ustawionym terminie.",
  uslugi: "Karty usług na podstronie „Usługi” (w kategoriach) i – po zaznaczeniu – na stronie głównej.",
  kategorie: "Kategorie grupują usługi i tworzą osobne tabele cennika.",
  cennik: "Każda kategoria to osobna tabela na stronie „Cennik”. Uwagę pod cennikiem edytuje się niżej.",
  pakiety: "Pakiety kilku usług w jednej cenie – podstrona „Usługi”.",
  wyrozniki: "Cztery powody, dla których warto wybrać warsztat – strona główna.",
  kroki: "Kolejne etapy wizyty – strona główna.",
  marki: "Marki, w których warsztat się specjalizuje – ciemna sekcja na stronie głównej.",
  galeria: "Zdjęcia warsztatu. Kategorie tworzą filtry nad galerią; zdjęcie powiększa się po kliknięciu.",
  opinie: "Prawdziwe opinie klientów. Gdy lista jest pusta, na stronie widać tylko przycisk do opinii w Google.",
  faq: "Pytania i odpowiedzi na podstronie „Cennik”.",
  czesci: "Punkty w sekcji „Z czym pracujemy” na podstronie „O nas”.",
  zespol: "Osoby na podstronie „O nas”."
};
function stronaKolekcji(kol) {
  var c = KOL[kol];
  var h = glowa(c.t, OPISY_KOL[kol] || "", c.sek) + '<div class="cmsp-karta">' + htmlListy(kol) + "</div>";
  if (kol === "cennik") h += '<div class="cmsp-karta"><h2>Uwaga pod cennikiem</h2>' + htmlPola({ k: "cennikUwaga", l: "Treść uwagi", t: "textarea", fmt: true }, S.cennikUwaga, { sciezka: "cennikUwaga" }) + "</div>";
  return h;
}

/* ---------- okno edycji ---------- */
function otworzEdycje(kol, id) {
  var c = KOL[kol], nowy = !id, D = dzisISO();
  var x = nowy ? { id: uid(), ukryta: false } : JSON.parse(JSON.stringify(S[kol].filter(function (e) { return e.id === id; })[0]));
  if (nowy) {
    c.pola.forEach(function (f) { if (!(f.k in x)) x[f.k] = f.t === "check" ? false : ""; });
    if (c.czasowa) { x.od = D; x.do = dodajDni(D, 14); }
    if (kol === "aktualnosci") x.data = D;
    if (kol === "uslugi") { x.kategoria = S.kategorie[0] && S.kategorie[0].id; x.ikona = "check"; x.przycisk = "zadzwon"; }
    if (kol === "cennik") x.kategoria = S.kategorie[0] && S.kategorie[0].id;
    if (kol === "opinie") x.ocena = "5";
    if (kol === "dniSpecjalne") { x.data = dodajDni(D, 7); x.nieczynne = true; x.od = "09:00"; x.do = "13:00"; }
    if (kol === "atuty" || kol === "wyrozniki") x.ikona = "check";
  }
  var tlo = document.createElement("div"); tlo.className = "cmsp-modal-tlo";
  tlo.innerHTML = '<div class="cmsp-modal" role="dialog" aria-modal="true" aria-labelledby="cmsp-m-t"><div class="cmsp-modal__glowa"><h2 id="cmsp-m-t">' + (nowy ? "Dodaj " + c.j : "Edytuj " + c.j) + '</h2><button type="button" class="cmsp-x" data-m="anuluj" aria-label="Zamknij">×</button></div>' +
    '<form class="cmsp-modal__cialo" novalidate><p class="cmsp-blad" role="alert" hidden></p><div class="cmsp-pola">' + c.pola.map(function (f) { return htmlPola(f, x[f.k]); }).join("") + "</div></form>" +
    '<div class="cmsp-modal__stopka">' + (nowy ? "" : '<button type="button" class="cmsp-btn cmsp-btn--usun" data-m="usun">Usuń</button>') + '<button type="button" class="cmsp-btn" data-m="anuluj">Anuluj</button><button type="button" class="cmsp-btn cmsp-btn--ciem" data-m="zapisz">' + (nowy ? "Dodaj" : "Zapisz zmiany") + "</button></div></div>";
  document.body.appendChild(tlo);
  var powrot = document.activeElement, form = tlo.querySelector("form");
  var zamknij = function () { tlo.remove(); document.removeEventListener("keydown", klaw); if (powrot && document.contains(powrot)) powrot.focus(); else { var m = document.querySelector(".cmsp-main"); if (m) m.focus(); } };
  var klaw = function (e) {
    if (e.key === "Escape") { e.stopPropagation(); zamknij(); }
    if (e.key === "Tab") { var f = tlo.querySelectorAll("button, input:not([type=hidden]), select, textarea"); var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  };
  document.addEventListener("keydown", klaw);
  var syncGodz = function () { var n = form.querySelector('[data-k="nieczynne"]'); if (n) form.querySelectorAll('[data-k="od"],[data-k="do"]').forEach(function (i) { i.disabled = n.checked; }); };
  if (kol === "dniSpecjalne") { syncGodz(); form.addEventListener("change", syncGodz); }
  podlaczZdjecia(tlo);
  tlo.addEventListener("click", function (e) {
    var b = e.target.closest("[data-m]"); if (!b) return;
    if (b.dataset.m === "anuluj") zamknij();
    if (b.dataset.m === "usun") potwierdz(b, function () { S[kol] = S[kol].filter(function (e) { return e.id !== x.id; }); zamknij(); poZmianie("Usunięto."); });
    if (b.dataset.m === "zapisz") {
      c.pola.forEach(function (f) {
        if (f.t === "image") { var bl = form.querySelector('[data-k="' + f.k + '"]').closest(".cmsp-pole"); x[f.k] = wartoscZdjecia(bl); }
        else { var el = form.querySelector('[data-k="' + f.k + '"]'); if (el) x[f.k] = f.t === "check" ? el.checked : el.value.trim(); }
      });
      var blad = waliduj(kol, x);
      var bl2 = form.querySelector(".cmsp-blad");
      if (blad) { bl2.textContent = blad; bl2.hidden = false; bl2.scrollIntoView({ block: "nearest" }); return; }
      if (nowy) { c.czasowa ? S[kol].unshift(x) : S[kol].push(x); }
      else S[kol] = S[kol].map(function (e) { return e.id === x.id ? x : e; });
      if (c.sortowana) S[kol].sort(function (a, b) { return a.data < b.data ? -1 : 1; });
      zamknij();
      var msg = nowy ? "Dodano. Zmiana jest już na stronie." : "Zapisano zmiany.";
      if (c.czasowa) { var st = statusCzasowy(x); if (st === "zaplanowana") msg = (nowy ? "Dodano" : "Zapisano") + ". Pojawi się na stronie " + dataSlownie(x.od) + "."; else if (st !== "aktywna") msg = (nowy ? "Dodano" : "Zapisano") + " – status: " + STATUS_NAZWY[st].toLowerCase() + ", na stronie niewidoczna."; }
      if (x.ukryta) msg = "Zapisano. Pozycja jest ukryta na stronie.";
      poZmianie(msg);
    }
  });
  setTimeout(function () { var f = form.querySelector("input:not([type=hidden]):not([type=file]), textarea, select"); if (f) f.focus(); }, 20);
}
function waliduj(kol, x) {
  var c = KOL[kol];
  for (var i = 0; i < c.pola.length; i++) { var f = c.pola[i]; if (f.wym && !x[f.k]) return f.t === "image" ? "Proszę dodać zdjęcie – w tej sekcji jest wymagane." : "Proszę uzupełnić pole „" + f.l + "”."; }
  if (c.czasowa && x.od && x.do && x.do < x.od) return "Data „Pokazuj do” nie może być wcześniejsza niż „Pokazuj od”.";
  if (kol === "dniSpecjalne" && !x.nieczynne) {
    if (!x.od || !x.do) return "Proszę podać godziny otwarcia albo zaznaczyć „Warsztat nieczynny”.";
    if (minuty(x.do) <= minuty(x.od)) return "Godzina zamknięcia musi być późniejsza niż otwarcia.";
  }
  return "";
}
function podlaczZdjecia(kontener) {
  kontener.querySelectorAll(".cmsp-foto").forEach(function (bl) {
    var pole = bl.closest(".cmsp-pole"), podglad = bl.querySelector("[data-podglad]"), url = bl.querySelector("[data-foto]"), dane = bl.querySelector("[data-foto-dane]"), bp = bl.querySelector("[data-bp]");
    var odswiez = function () { var w = wartoscZdjecia(pole); podglad.innerHTML = w ? obraz(w, "") : "brak zdjęcia"; if (url.dataset.sciezka) { ustaw(url.dataset.sciezka, w); poZmianie(null, true); } };
    bl.querySelector("[data-wgraj]").addEventListener("change", function (e) {
      var p = e.target.files[0]; if (!p) return;
      zmniejsz(p, 1400, function (d) { dane.value = d; url.value = ""; bp.value = ""; odswiez(); toast("Zdjęcie wgrane i zmniejszone do " + 1400 + " px."); });
    });
    url.addEventListener("input", function (e) { e.stopPropagation(); dane.value = ""; bp.value = ""; odswiez(); });
    bp.addEventListener("change", function (e) { e.stopPropagation(); if (bp.value) { url.value = bp.value; dane.value = ""; odswiez(); } });
    bl.querySelector('[data-akcja="usun-foto"]').addEventListener("click", function (e) { e.stopPropagation(); url.value = ""; dane.value = ""; bp.value = ""; odswiez(); });
  });
}
function potwierdz(btn, wykonaj) {
  if (btn.classList.contains("cmsp-potw")) { wykonaj(); return; }
  var t = btn.textContent; btn.classList.add("cmsp-potw"); btn.textContent = "Na pewno?";
  setTimeout(function () { if (document.contains(btn)) { btn.classList.remove("cmsp-potw"); btn.textContent = t; } }, 3500);
}
var renderTimer = null;
function poZmianie(komunikat, bezRysowaniaStrony) {
  zapisz();
  clearTimeout(renderTimer);
  renderTimer = setTimeout(function () { render({ zachowajScroll: true }); }, bezRysowaniaStrony ? 250 : 0);
  rysujNav();
  if (!bezRysowaniaStrony) {
    var m = document.querySelector(".cmsp-main"), y = m ? m.scrollTop : 0;
    rysujStrone(); if (m) m.scrollTop = y;
  }
  if (komunikat) toast(komunikat);
}

/* ---------- zdarzenia panelu ---------- */
function klikPanel(e) {
  var b = e.target.closest("[data-akcja]"); if (!b) return;
  var a = b.dataset.akcja, kol = b.dataset.kol, id = b.dataset.id;
  var idx = kol ? S[kol].findIndex(function (x) { return x.id === id; }) : -1;
  if (a === "zamknij") zamknijPanel();
  else if (a === "wyloguj") wyloguj();
  else if (a === "idz") { CMS.strona = b.dataset.strona; rysujNav(); rysujStrone(); document.querySelector(".cmsp-main").scrollTop = 0; var nb = document.querySelector('.cmsp-nav [aria-current="page"]'); if (nb && nb.scrollIntoView) nb.scrollIntoView({ block: "nearest", inline: "nearest" }); }
  else if (a === "zobacz") zamknijPanel(b.dataset.sek);
  else if (a === "dodaj") otworzEdycje(kol);
  else if (a === "szybko") { CMS.strona = b.dataset.kol; rysujNav(); rysujStrone(); otworzEdycje(b.dataset.kol); }
  else if (a === "edytuj") otworzEdycje(kol, id);
  else if (a === "filtr") { CMS.filtry[kol] = b.dataset.filtr; rysujStrone(); }
  else if (a === "gora" || a === "dol") {
    var j = a === "gora" ? idx - 1 : idx + 1; if (j < 0 || j >= S[kol].length) return;
    var t = S[kol][idx]; S[kol][idx] = S[kol][j]; S[kol][j] = t;
    poZmianie("Zmieniono kolejność.");
    var nb2 = document.querySelector('[data-wiersz="' + id + '"] [data-akcja="' + a + '"]'); if (nb2 && !nb2.disabled) nb2.focus();
  }
  else if (a === "ukryj") { S[kol][idx].ukryta = !S[kol][idx].ukryta; poZmianie(S[kol][idx].ukryta ? "Ukryto – pozycja nie jest widoczna na stronie." : "Pokazano na stronie."); }
  else if (a === "duplikuj") { var k = JSON.parse(JSON.stringify(S[kol][idx])); k.id = uid(); var tk = KOL[kol].tytulK || (k.tytul != null ? "tytul" : k.nazwa != null ? "nazwa" : null); if (tk && k[tk] != null && !KOL[kol].tytulF) k[tk] += " (kopia)"; S[kol].splice(idx + 1, 0, k); poZmianie("Zduplikowano."); }
  else if (a === "usun") potwierdz(b, function () { S[kol].splice(idx, 1); poZmianie("Usunięto."); });
  else if (a === "kopiuj-pn") {
    var pn = S.godziny[0], do_ = b.dataset.zakres === "tydzien" ? 7 : 5;
    for (var i = 1; i < do_; i++) S.godziny[i] = { otwarte: pn.otwarte, od: pn.od, do: pn.do };
    poZmianie(do_ === 7 ? "Skopiowano poniedziałek na cały tydzień." : "Skopiowano poniedziałek na wtorek–piątek.");
  }
  else if (a === "sekcja-rozwin") { CMS.otwarteSekcje[b.dataset.sek] = !CMS.otwarteSekcje[b.dataset.sek]; rysujStrone(); var r = document.querySelector('[data-akcja="sekcja-rozwin"][data-sek="' + b.dataset.sek + '"]'); if (r) r.focus(); }
  else if (a === "eksport-kopiuj") {
    var ta = document.getElementById("cmsp-eksport");
    var ok = function () { toast("Skopiowano do schowka."); }, recznie = function () { ta.focus(); ta.select(); toast("Zaznaczono dane – proszę skopiować skrótem Ctrl+C."); };
    try { navigator.clipboard.writeText(ta.value).then(ok, recznie); } catch (er) { recznie(); }
  }
  else if (a === "eksport-pobierz") {
    var blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" }), u = URL.createObjectURL(blob), l = document.createElement("a");
    l.href = u; l.download = "szalone-auto-kopia-" + dzisISO() + ".json"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
    toast("Pobieranie pliku kopii…");
  }
  else if (a === "import") importuj(document.getElementById("cmsp-import").value);
  else if (a === "reset-1") { document.getElementById("cmsp-reset-krok2").hidden = false; document.getElementById("cmsp-reset-zgoda").focus(); }
  else if (a === "reset-2") {
    if (!document.getElementById("cmsp-reset-zgoda").checked) return;
    S = scalStan(null); CMS.strona = "pulpit"; poZmianie("Przywrócono treści początkowe.");
  }
}
function wpisPanel(e) {
  var el = e.target; if (!el.dataset.sciezka || el.dataset.foto !== undefined) return;
  if (el.dataset.typ === "check") return;
  ustaw(el.dataset.sciezka, el.value);
  poZmianie(null, true);
}
function zmianaPanel(e) {
  var el = e.target;
  if (el.id === "cmsp-import-plik") { var p = el.files[0]; if (!p) return; var r = new FileReader(); r.onload = function () { document.getElementById("cmsp-import").value = r.result; toast("Wczytano plik. Kliknij „Importuj”."); }; r.readAsText(p); return; }
  if (el.id === "cmsp-reset-zgoda") { document.querySelector('[data-akcja="reset-2"]').disabled = !el.checked; return; }
  if (!el.dataset.sciezka || el.dataset.foto !== undefined) return;
  if (el.dataset.typ === "check") { ustaw(el.dataset.sciezka, el.checked); poZmianie(el.dataset.sciezka.indexOf("sekcje.") === 0 ? (el.checked ? "Sekcja jest widoczna na stronie." : "Sekcja ukryta na stronie.") : "Zapisano zmiany."); return; }
  ustaw(el.dataset.sciezka, el.value);
  if (/^godziny\./.test(el.dataset.sciezka)) { poZmianie("Zapisano godziny."); return; }
  zapisz(); toast("Zapisano zmiany.");
}
function importuj(tekst) {
  var d;
  try { d = JSON.parse(tekst); } catch (e) { toast("To nie jest poprawny plik kopii (błąd formatu JSON).", true); return; }
  if (!d || d._app !== APP_ID) { toast("Ta kopia nie pochodzi z tego panelu – import przerwany.", true); return; }
  S = scalStan(d); poZmianie("Zaimportowano kopię zapasową.");
}

/* ---------- strony singletonów ---------- */
function polaSingl(prefiks, defs) { return '<div class="cmsp-pola">' + defs.map(function (f) { return htmlPola(f, pobierz(prefiks + "." + f.k), { sciezka: prefiks + "." + f.k }); }).join("") + "</div>"; }
function stronaGlowna() {
  return glowa("Strona główna", "Nagłówek strony, zdjęcia slidera i atuty pod przyciskami. Hasło firmy pokazuje się w stopce.", "hero") +
    '<div class="cmsp-karta"><h2>Nagłówek</h2>' + polaSingl("start", [{ k: "nadtytul", l: "Nadtytuł", t: "text", pelne: true }, { k: "tytul", l: "Tytuł główny", t: "text", pelne: true, fmt: true }, { k: "wstep", l: "Wprowadzenie", t: "textarea", fmt: true }, { k: "kartaTytul", l: "Karteczka na zdjęciu – tytuł", t: "text" }, { k: "kartaOpis", l: "Karteczka na zdjęciu – opis", t: "text" }]) + "</div>" +
    '<div class="cmsp-karta"><h2>Firma i hasło</h2>' + polaSingl("firma", [{ k: "nazwa", l: "Nazwa firmy (logo, tytuły)", t: "text" }, { k: "podpis", l: "Podpis w logo", t: "text" }, { k: "haslo", l: "Hasło w stopce", t: "text", pelne: true, fmt: true }]) + "</div>" +
    '<div class="cmsp-karta"><h2>Zdjęcia slidera</h2><p class="cmsp-op">Zmieniają się co 6 sekund z delikatnym zbliżeniem. Najlepiej zdjęcia poziome, ok. 1400 px.</p>' + htmlListy("slider") + "</div>" +
    '<div class="cmsp-karta"><h2>Atuty pod przyciskami</h2>' + htmlListy("atuty") + "</div>";
}
function stronaONas() {
  return glowa("O firmie", "Tekst o warsztacie na podstronie „O nas” i dwa zdjęcia obok.", "onas") +
    '<div class="cmsp-karta">' + polaSingl("onas", [{ k: "nadtytul", l: "Nadtytuł", t: "text" }, { k: "tytul", l: "Tytuł podstrony", t: "text", fmt: true }, { k: "wstep", l: "Wprowadzenie", t: "textarea" }, { k: "naglowek", l: "Nagłówek nad tekstem", t: "text", pelne: true }, { k: "tekst", l: "Tekst o firmie", t: "textarea", fmt: true }, { k: "zdjecie1", l: "Zdjęcie 1", t: "image" }, { k: "zdjecie2", l: "Zdjęcie 2", t: "image" }]) + "</div>";
}
function stronaKontakt() {
  return glowa("Dane kontaktowe", "Zmiany od razu aktualizują wszystkie przyciski „Zadzwoń”, SMS, stopkę i link do Map Google.", "kontakt") +
    '<div class="cmsp-karta">' + polaSingl("kontakt", [{ k: "telefon", l: "Telefon", t: "tel" }, { k: "sms", l: "Numer do SMS", t: "tel" }, { k: "email", l: "E-mail", t: "email" }, { k: "adres", l: "Ulica i numer", t: "text" }, { k: "kod", l: "Kod pocztowy", t: "text" }, { k: "miasto", l: "Miasto", t: "text" }, { k: "dzielnica", l: "Dzielnica", t: "text" }, { k: "googleOpinie", l: "Link do opinii w Google", t: "url" }, { k: "facebook", l: "Facebook", t: "url" }, { k: "instagram", l: "Instagram", t: "url" }]) +
    '<p class="cmsp-pomoc-fmt">Mapa i przycisk „Wyznacz trasę” budują się automatycznie z adresu: <a href="' + mapaLink() + '" target="_blank" rel="noopener">sprawdź w Google Maps</a>.</p></div>';
}
function stronaInfo() {
  return glowa("Informacje praktyczne", "Parking, dojazd, płatności, gwarancja i dostępność – podstrony „Kontakt” i „Cennik”.", "dojazd") +
    '<div class="cmsp-karta">' + polaSingl("info", [{ k: "parking", l: "Parking", t: "textarea", fmt: true }, { k: "komunikacja", l: "Komunikacja miejska", t: "textarea", fmt: true }, { k: "platnosci", l: "Płatności", t: "textarea", fmt: true }, { k: "gwarancja", l: "Gwarancja", t: "textarea", fmt: true }, { k: "dostepnosc", l: "Dostępność", t: "textarea", fmt: true }, { k: "odbior", l: "Odbiór auta", t: "textarea", fmt: true }]) + "</div>";
}
function stronaGodziny() {
  var st = stanOtwarcia();
  var wiersze = S.godziny.map(function (g, i) {
    var ostrz = g.otwarte && minuty(g.do) <= minuty(g.od) ? '<span class="cmsp-ostrz" role="alert">Godzina zamknięcia musi być późniejsza niż otwarcia.</span>' : "";
    return '<div class="cmsp-godz"><strong>' + DNI[i] + '</strong><label class="cmsp-check"><input type="checkbox" data-sciezka="godziny.' + i + '.otwarte" data-typ="check"' + (g.otwarte ? " checked" : "") + ">" + (g.otwarte ? "Otwarte" : "Nieczynne") + "</label>" +
      '<label class="sr" for="g-od-' + i + '">' + DNI[i] + ' – od</label><input type="time" id="g-od-' + i + '" data-sciezka="godziny.' + i + '.od" data-typ="text" value="' + g.od + '"' + (g.otwarte ? "" : " disabled") + ">" +
      '<label class="sr" for="g-do-' + i + '">' + DNI[i] + ' – do</label><input type="time" id="g-do-' + i + '" data-sciezka="godziny.' + i + '.do" data-typ="text" value="' + g.do + '"' + (g.otwarte ? "" : " disabled") + ">" + ostrz + "</div>";
  }).join("");
  return glowa("Godziny otwarcia", "Godziny tygodniowe i dni specjalne (święta, skrócone dni). Dni specjalne mają pierwszeństwo i pokazują się na stronie 60 dni wcześniej jako „Zmiany w godzinach”.", "kontakt") +
    '<div class="cmsp-karta"><div class="cmsp-pasek-listy"><span class="cmsp-podglad-stan" data-stan="' + st.stan + '"><i></i>' + st.tekst + '</span><div class="cmsp-szybkie"><button type="button" class="cmsp-btn cmsp-btn--mini" data-akcja="kopiuj-pn" data-zakres="pt">Kopiuj poniedziałek na wt–pt</button><button type="button" class="cmsp-btn cmsp-btn--mini" data-akcja="kopiuj-pn" data-zakres="tydzien">Kopiuj poniedziałek na cały tydzień</button></div></div><div class="cmsp-godziny">' + wiersze + "</div></div>" +
    '<div class="cmsp-karta"><h2>Dni specjalne</h2><p class="cmsp-op">Sortują się automatycznie według daty.</p>' + htmlListy("dniSpecjalne") + "</div>";
}
function stronaSekcje() {
  var h = glowa("Sekcje strony", "Włączanie i wyłączanie sekcji oraz ich tytuły. Wyłączona sekcja znika ze strony, ale jej treści zostają w panelu.", null);
  WIDOKI.forEach(function (w) {
    h += '<p class="cmsp-widok-et">Podstrona: ' + w[1] + '</p><div class="cmsp-sekcje">';
    S.sekcje.forEach(function (s, i) {
      if (s.widok !== w[0]) return;
      var bezPol = s.id === "hero" || s.id === "onas";
      h += '<div class="cmsp-sekcja"><div class="cmsp-sekcja__wiersz"><span class="cmsp-przel"><input type="checkbox" id="sk-' + s.id + '" data-sciezka="sekcje.' + i + '.widoczna" data-typ="check"' + (s.widoczna !== false ? " checked" : "") + ' aria-label="Pokazuj sekcję: ' + esc(s.nazwa) + '"><span></span></span><label for="sk-' + s.id + '"><strong>' + esc(s.nazwa) + "</strong></label>" +
        '<span class="cmsp-plak cmsp-plak--' + (s.widoczna !== false ? "widoczna" : "ukryta") + '">' + (s.widoczna !== false ? "Widoczna" : "Ukryta") + "</span>" +
        (bezPol ? '<span class="cmsp-pomoc-fmt">treść: ' + (s.id === "hero" ? "Strona główna" : "O firmie") + "</span>" : '<button type="button" class="cmsp-btn cmsp-btn--mini" data-akcja="sekcja-rozwin" data-sek="' + s.id + '" aria-expanded="' + !!CMS.otwarteSekcje[s.id] + '">' + (CMS.otwarteSekcje[s.id] ? "Zwiń" : "Tytuł i wstęp") + "</button>") + "</div>" +
        (CMS.otwarteSekcje[s.id] && !bezPol ? '<div class="cmsp-sekcja__pola">' + polaSingl("sekcje." + i, [{ k: "nadtytul", l: "Nadtytuł", t: "text" }, { k: "tytul", l: "Tytuł sekcji", t: "text", fmt: true }, { k: "wstep", l: "Wprowadzenie", t: "textarea" }]) + "</div>" : "") + "</div>";
    });
    h += "</div>";
  });
  return h;
}
function stronaKopia() {
  return glowa("Kopia zapasowa", "Dane panelu zapisują się w tej przeglądarce. Warto co jakiś czas pobrać kopię – pozwala przenieść treści na inny komputer.", null) +
    '<div class="cmsp-karta"><h2>Eksport</h2><label class="sr" for="cmsp-eksport">Dane w formacie JSON</label><textarea class="cmsp-json" id="cmsp-eksport" rows="6" readonly>' + esc(JSON.stringify(S)) + '</textarea><div class="cmsp-szybkie"><button type="button" class="cmsp-btn" data-akcja="eksport-kopiuj">Kopiuj do schowka</button><button type="button" class="cmsp-btn cmsp-btn--ciem" data-akcja="eksport-pobierz">Pobierz plik .json</button></div></div>' +
    '<div class="cmsp-karta"><h2>Import</h2><p class="cmsp-op">Wklej dane kopii albo wybierz plik .json pobrany z tego panelu. Import zastępuje obecne treści.</p><label class="sr" for="cmsp-import">Dane kopii do importu</label><textarea class="cmsp-json" id="cmsp-import" rows="5" placeholder="Wklej tutaj zawartość pliku kopii…"></textarea><div class="cmsp-szybkie"><span class="cmsp-btn cmsp-plik">Wybierz plik…<input type="file" id="cmsp-import-plik" accept=".json,application/json" aria-label="Wybierz plik kopii"></span><button type="button" class="cmsp-btn cmsp-btn--ciem" data-akcja="import">Importuj</button></div></div>' +
    '<div class="cmsp-karta"><h2>Treści początkowe</h2><p class="cmsp-op">Usuwa wszystkie zmiany wprowadzone w panelu i przywraca treści z projektu.</p><div><button type="button" class="cmsp-btn cmsp-btn--usun" data-akcja="reset-1">Przywróć treści początkowe</button></div>' +
    '<div id="cmsp-reset-krok2" hidden style="display:grid;gap:.6rem"><label class="cmsp-check"><input type="checkbox" id="cmsp-reset-zgoda">Rozumiem, że wszystkie zmiany zostaną bezpowrotnie usunięte.</label><div><button type="button" class="cmsp-btn cmsp-btn--usun cmsp-potw" data-akcja="reset-2" disabled>Tak, przywróć treści początkowe</button></div></div></div>';
}

/* ---------- pulpit ---------- */
function stronaPulpit() {
  var D = dzisISO(), st = stanOtwarcia();
  var prA = liczAktywne("promocje"), prZ = widoczne(S.promocje).filter(function (x) { return statusCzasowy(x) === "zaplanowana"; }).length;
  var akA = liczAktywne("aktualnosci");
  var kafel = function (str, et, wart, dop, cls, stan) { return '<button type="button" class="cmsp-kafel ' + (cls || "") + '" data-akcja="idz" data-strona="' + str + '"' + (stan ? ' data-stan="' + stan + '"' : "") + "><span>" + et + "</span><strong>" + wart + "</strong><small>" + dop + "</small></button>"; };
  var stanTxt = st.tekst.split(" · ");
  return '<div class="cmsp-glowa"><div><h1>Dzień dobry!</h1><p>' + dataSlownie(D) + " · " + esc(S.firma.nazwa) + '</p></div><div class="cmsp-szybkie"><button type="button" class="cmsp-btn cmsp-btn--gl" data-akcja="szybko" data-kol="promocje">+ Promocja</button><button type="button" class="cmsp-btn cmsp-btn--gl" data-akcja="szybko" data-kol="aktualnosci">+ Aktualność</button><button type="button" class="cmsp-btn" data-akcja="idz" data-strona="godziny">' + ico("zegar") + "Godziny</button></div></div>" +
    '<div class="cmsp-kafle">' +
    kafel("godziny", "Warsztat teraz", "<i></i>" + (st.stan === "zamkniete" ? "Zamknięte" : "Otwarte"), stanTxt[1] || stanTxt[0], "cmsp-kafel--stan", st.stan) +
    kafel("promocje", "Aktywne promocje", prA, prZ ? "zaplanowane: " + prZ : "brak zaplanowanych") +
    kafel("aktualnosci", "Aktualności na stronie", akA, "wszystkich: " + S.aktualnosci.length) +
    kafel("uslugi", "Usługi", widoczne(S.uslugi).length, "w " + widoczne(S.kategorie).length + " kategoriach") +
    kafel("galeria", "Zdjęcia w galerii", widoczne(S.galeria).length, "ukryte: " + S.galeria.filter(function (x) { return x.ukryta; }).length) +
    kafel("opinie", "Opinie", widoczne(S.opinie).length, widoczne(S.opinie).length ? "średnia " + (widoczne(S.opinie).reduce(function (a, b) { return a + (+b.ocena || 5); }, 0) / widoczne(S.opinie).length).toFixed(1).replace(".", ",") : "dodaj prawdziwe opinie") +
    "</div>" +
    '<div class="cmsp-karta" style="margin-top:1rem"><h2>Harmonogram promocji i aktualności</h2><p class="cmsp-op">30 dni wstecz i 90 dni naprzód. Kliknij pasek, żeby edytować wpis.</p>' + htmlGantt() +
    '<div class="cmsp-legenda"><span><i style="background:#2F8F5B"></i>Aktywne</span><span><i style="background:#D9A21B"></i>Zaplanowane</span><span><i style="background:#A3A9B3"></i>Zakończone / wstrzymane</span><span><i style="background:#B3261E;width:2px;height:14px"></i>Dzisiaj</span></div></div>' +
    '<div class="cmsp-karta"><h2>Najbliższe 45 dni</h2>' + htmlTerminy() + "</div>";
}
function htmlGantt() {
  var D = dzisISO(), start = dodajDni(D, -30), koniec = dodajDni(D, 90), DNI_Z = 120;
  var wiersze = [];
  ["promocje", "aktualnosci"].forEach(function (kol) {
    widoczne(S[kol]).forEach(function (x) {
      var od = x.od || start, do_ = x.do || koniec;
      if (do_ < start || od > koniec) return;
      wiersze.push({ kol: kol, x: x, od: od, do: do_ });
    });
  });
  if (!wiersze.length) return '<div class="cmsp-pusto">Brak promocji i aktualności w tym okresie.</div>';
  wiersze.sort(function (a, b) { return a.od < b.od ? -1 : 1; });
  var W = 1000, L = 240, P = 12, G = 36, RH = 32, H = G + wiersze.length * RH + 8;
  var dzien = function (iso) { return Math.round((zISO(iso) - zISO(start)) / 864e5); };
  var X = function (n) { return L + n / DNI_Z * (W - L - P); };
  var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Harmonogram: ' + wiersze.length + ' wpisów">';
  for (var i = 0; i <= DNI_Z; i++) {
    var d = dodajDni(start, i);
    if (d.slice(8) === "01") s += '<line x1="' + X(i) + '" y1="' + (G - 8) + '" x2="' + X(i) + '" y2="' + H + '" stroke="#E3E6EA"/><text x="' + (X(i) + 4) + '" y="' + (G - 14) + '" font-size="12" fill="#565C66">' + MIESIACE_K[+d.slice(5, 7) - 1] + "</text>";
  }
  wiersze.forEach(function (w, n) {
    var y = G + n * RH, st = statusCzasowy(w.x), kolor = st === "aktywna" ? "#2F8F5B" : st === "zaplanowana" ? "#D9A21B" : "#A3A9B3";
    var a = Math.max(0, dzien(w.od)), b = Math.min(DNI_Z, dzien(w.do) + 1);
    var t = w.x.tytul.length > 30 ? w.x.tytul.slice(0, 29) + "…" : w.x.tytul;
    s += '<g data-akcja="edytuj" data-kol="' + w.kol + '" data-id="' + w.x.id + '" style="cursor:pointer"><title>' + esc(w.x.tytul) + " · " + STATUS_NAZWY[st] + " · " + zakres(w.x) + "</title>" +
      '<rect x="0" y="' + y + '" width="' + W + '" height="' + RH + '" fill="' + (n % 2 ? "#FAFBFC" : "#FFFFFF") + '"/>' +
      '<text x="8" y="' + (y + 20) + '" font-size="13" fill="#15171C"><tspan fill="#8A909A" font-size="11">' + (w.kol === "promocje" ? "PROMO " : "INFO ") + "</tspan>" + esc(t) + "</text>" +
      '<rect x="' + X(a) + '" y="' + (y + 8) + '" width="' + Math.max(4, X(b) - X(a) - 2) + '" height="16" rx="4" fill="' + kolor + '"/>' +
      (!w.x.do ? '<path d="M' + (X(b) - 10) + " " + (y + 10) + "l8 6-8 6" + '" stroke="#fff" stroke-width="2" fill="none"/>' : "") + "</g>";
  });
  var xd = X(30);
  s += '<line x1="' + xd + '" y1="' + (G - 8) + '" x2="' + xd + '" y2="' + H + '" stroke="#B3261E" stroke-width="2"/><text x="' + (xd + 4) + '" y="12" font-size="12" font-weight="700" fill="#B3261E">dzisiaj</text></svg>';
  return '<div class="cmsp-gantt">' + s + "</div>";
}
function htmlTerminy() {
  var D = dzisISO(), K = dodajDni(D, 45), z = [];
  [["promocje", "Promocja"], ["aktualnosci", "Aktualność"]].forEach(function (p) {
    widoczne(S[p[0]]).forEach(function (x) {
      if (x.wstrzymana) return;
      if (x.od && x.od > D && x.od <= K) z.push({ d: x.od, plak: "zaplanowana", et: "Pojawi się", t: p[1] + ": " + x.tytul });
      if (x.do && x.do >= D && x.do <= K && (!x.od || x.od <= x.do)) z.push({ d: dodajDni(x.do, 1), plak: "zakonczona", et: "Zniknie", t: p[1] + ": " + x.tytul + " (ostatni dzień " + dataKrotko(x.do) + ")" });
    });
  });
  widoczne(S.dniSpecjalne).forEach(function (x) { if (x.data >= D && x.data <= K) z.push({ d: x.data, plak: "wstrzymana", et: "Godziny", t: (x.nieczynne ? "warsztat nieczynny" : "otwarte " + godz(x.od) + "–" + godz(x.do)) + (x.opis ? " (" + x.opis + ")" : "") }); });
  if (!z.length) return '<div class="cmsp-pusto">W najbliższych 45 dniach nic się nie zmienia.</div>';
  z.sort(function (a, b) { return a.d < b.d ? -1 : 1; });
  return '<ul class="cmsp-terminy">' + z.map(function (e) { return '<li><time datetime="' + e.d + '">' + dataKrotko(e.d) + "." + e.d.slice(2, 4) + '</time><span class="cmsp-plak cmsp-plak--' + e.plak + '">' + e.et + "</span><span>" + esc(e.t) + "</span></li>"; }).join("") + "</ul>";
}

/* ---------- start ---------- */
function start() {
  var k = document.getElementById("cms-klodka");
  k.addEventListener("click", function () { cmsWejdz(k); });
  odswiezKlodke();
  wczytajZapis().then(function (z) {
    if (z && z._app === APP_ID) S = scalStan(z);
    trasa(location.hash, false);
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
