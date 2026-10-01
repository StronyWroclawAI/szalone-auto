# Szalone auto – strona warsztatu z panelem administracyjnym

Projekt do portfolio **Strony AI Wrocław**. Firma i część danych są przykładowe.

## Struktura

| Folder | Co zawiera | Publikowany? |
|---|---|---|
| `public/` | strona (`index.html` – strona + panel w jednym pliku), `img/`, `_headers`, `robots.txt` | **tak** – to folder dla Cloudflare Pages |
| `projekt/` | logo (SVG), dokument projektu marki, pliki źródłowe | nie |

## Panel administratora

Kłódka w lewym dolnym rogu strony lub link „Panel administratora” w stopce.
Wersja demo: login `admin`, hasło `warsztat`. Zmiany zapisują się tylko w przeglądarce osoby edytującej (IndexedDB).

## Wdrożenie na Cloudflare Pages

1. Workers & Pages → Create → Pages → Connect to Git → wybierz to repozytorium.
2. Ustawienia builda:
   - Framework preset: **None**
   - Build command: *(puste)*
   - Build output directory: **public**
3. Save and Deploy. Każdy `git push` na gałąź `main` publikuje nową wersję.

## Indeksowanie

Strona ma `noindex` (plik `public/_headers` i `public/robots.txt`), bo to demo z fikcyjnym adresem.
Przy wdrożeniu dla prawdziwej firmy usuń linię `X-Robots-Tag` z `_headers` i zawartość `robots.txt`.

## Edycja kodu

`public/index.html` jest złożony z plików w `projekt/zrodla/` (CSS i JS). Najprościej edytować bezpośrednio `public/index.html`.
