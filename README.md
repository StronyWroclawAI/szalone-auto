# Szalone auto – strona warsztatu z panelem administracyjnym

Projekt do portfolio **Strony AI Wrocław**. Firma i część danych są przykładowe.

## Struktura

| Folder | Co zawiera | Publikowany? |
|---|---|---|
| `public/` | strona (`index.html` – strona + panel w jednym pliku), `img/`, `_headers`, `robots.txt` | **tak** – to folder dla Cloudflare Pages |
| `projekt/` | logo (SVG), dokument projektu marki, pliki źródłowe | nie |

## Panel administratora

Kłódka w lewym dolnym rogu strony lub link „Panel administratora” w stopce.
Dane logowania nie są zapisane w kodzie – w pliku jest tylko ich skrót SHA-256 (`CMS_SKROT`). Po 5 nieudanych próbach logowanie blokuje się na 30 s.
Zmiana danych: w konsoli przeglądarki na stronie wpisz `sha256("szalone-auto-cms|LOGIN|HASLO")` i wklej wynik do `CMS_SKROT` w `public/index.html`.
Zmiany zapisują się tylko w przeglądarce osoby edytującej (wersja demonstracyjna – sprawdzanie hasła odbywa się w przeglądarce).

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
