/* =====================================================================
   ZAPIS DANYCH: IndexedDB (awaryjnie localStorage) – tylko ta przeglądarka
   ===================================================================== */
var DB_NAZWA = "szalone-auto-cms", DB_MAGAZYN = "dane", DB_KLUCZ = "stan", LS_KLUCZ = "szalone-auto-cms-stan";
function idbOtworz() {
  return new Promise(function (ok, blad) {
    try {
      var r = indexedDB.open(DB_NAZWA, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(DB_MAGAZYN); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { blad(r.error); };
    } catch (e) { blad(e); }
  });
}
function idbCzytaj() {
  return idbOtworz().then(function (db) {
    return new Promise(function (ok, blad) { var t = db.transaction(DB_MAGAZYN, "readonly").objectStore(DB_MAGAZYN).get(DB_KLUCZ); t.onsuccess = function () { ok(t.result || null); }; t.onerror = function () { blad(t.error); }; });
  });
}
function idbZapisz(dane) {
  return idbOtworz().then(function (db) {
    return new Promise(function (ok, blad) { var tx = db.transaction(DB_MAGAZYN, "readwrite"); tx.objectStore(DB_MAGAZYN).put(dane, DB_KLUCZ); tx.oncomplete = function () { ok(); }; tx.onerror = function () { blad(tx.error); }; });
  });
}
function wczytajZapis() {
  return idbCzytaj().catch(function () { return null; }).then(function (d) {
    if (d) return d;
    try { var s = localStorage.getItem(LS_KLUCZ); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  });
}
/* Scalanie: zapis ma pierwszeństwo, ale nowe pola z kodu (dane początkowe) nie znikają */
function scal(d, s) {
  if (s === undefined || s === null) return d;
  if (Array.isArray(d)) return Array.isArray(s) ? s : d;
  if (d && typeof d === "object") {
    if (typeof s !== "object" || Array.isArray(s)) return d;
    var o = {}, k;
    for (k in d) o[k] = (k in s) ? scal(d[k], s[k]) : d[k];
    for (k in s) if (!(k in o)) o[k] = s[k];
    return o;
  }
  return typeof s === typeof d ? s : d;
}
function scalStan(zapis) {
  var d = daneStartowe(), w = scal(d, zapis || {});
  var poId = {}; (zapis && Array.isArray(zapis.sekcje) ? zapis.sekcje : []).forEach(function (s) { poId[s.id] = s; });
  w.sekcje = SEKCJE_DOMYSLNE.map(function (s) { return Object.assign({}, s, poId[s.id] || {}, { widok: s.widok, nazwa: s.nazwa }); });
  if (!Array.isArray(w.godziny) || w.godziny.length !== 7) w.godziny = d.godziny;
  w.godziny = w.godziny.map(function (g, i) { return Object.assign({}, d.godziny[i], g); });
  w._app = APP_ID; w._v = APP_WERSJA;
  return w;
}
var zapisTimer = null;
function zapisz() {
  ustawWskaznik("trwa");
  clearTimeout(zapisTimer);
  zapisTimer = setTimeout(function () {
    var dane = JSON.parse(JSON.stringify(S));
    idbZapisz(dane).then(function () { ustawWskaznik("ok"); }).catch(function () {
      try { localStorage.setItem(LS_KLUCZ, JSON.stringify(dane)); ustawWskaznik("ok"); }
      catch (e) { ustawWskaznik("blad"); }
    });
  }, 350);
}
function ustawWskaznik(stan) {
  var el = document.querySelector(".cmsp-zapis"); if (!el) return;
  el.setAttribute("data-stan", stan);
  var t = new Date();
  el.querySelector("span").textContent = stan === "trwa" ? "Zapisywanie…" : stan === "blad" ? "Błąd zapisu – za mało miejsca w przeglądarce" : "Zapisano " + t.getHours() + ":" + String(t.getMinutes()).padStart(2, "0");
}
