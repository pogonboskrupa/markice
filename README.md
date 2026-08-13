# Usporedba spiskova markica — Poljoprivredni zavod USK — PWA

## Šta je unutra
- `index.html` — sama aplikacija (radi i offline, čuva sačuvane liste lokalno na uređaju preko localStorage)
- `manifest.json` — omogućava instalaciju kao aplikacija (desktop i mobitel)
- `sw.js` — service worker, keširа fajlove za offline rad
- `icons/` — ikone aplikacije

## Deploy na Netlify (najbrže)
1. Idi na https://app.netlify.com/drop
2. Prevuci cijeli ovaj folder (ne pojedinačne fajlove, nego folder) u prozor na stranici
2. Netlify će ti odmah dati link tipa `https://nešto-random.netlify.app`
3. Otvori taj link na mobitelu/desktopu — browser će ponuditi "Instaliraj aplikaciju" ili "Dodaj na početni ekran"

Kasnije, ako želiš stalniji domen, možeš napraviti besplatan Netlify nalog i povezati ovaj folder trajno (ili ga povezati sa GitHub repozitorijem za automatski redeploy).

## Instalacija na uređaje
- **Android (Chrome):** otvori link → meni (⋮) → "Dodaj na početni ekran" / "Instaliraj aplikaciju"
- **iPhone (Safari):** otvori link → dugme Share → "Add to Home Screen"
- **Desktop (Chrome/Edge):** otvori link → ikona instalacije u adresnoj traci (ili meni → "Install app")

## PWA Builder (alternativa, npr. za Windows/Microsoft Store paket)
1. Prvo deployaj na Netlify (gore) da dobiješ https link — PWA Builder treba javno dostupan URL
2. Idi na https://www.pwabuilder.com
3. Zalijepi svoj Netlify link i klikni "Start"
4. PWA Builder će analizirati manifest/service worker (već su podešeni u ovom paketu) i ponuditi pakete za Windows, Android (APK) i iOS

## Napomena o podacima
Sačuvane liste (dugme "Sačuvaj obje liste") čuvaju se u localStorage **tog konkretnog browsera na tom uređaju** — ne sinhronizuju se automatski između mobitela i desktopa. Za to bi trebao pravi backend (npr. malu bazu), što mogu dodati naknadno ako zatrebaš.

## Uvoz iz Excel fajla (preporučeno)
Dugme "Odaberi .xlsx fajl" (odmah ispod naslova) učitava obje liste odjednom iz jednog Excel dokumenta — direktno na uređaju, bez ikakvog slanja na internet ili servera.

Aplikacija očekuje dokument sa dva taba tačno ovako nazvana:
- **Vakcinacija (Bruceloza)** → Lista 1 (Popis identifikacionih oznaka)
- **Potvrda o Stanju Životinja** → Lista 2 (Potvrda o stanju životinja)

Iz svakog taba čita se kolona B (šifra/identifikacijski broj životinje); naslovni i "Ukupno evidencija" redovi se automatski ignorišu. Ako fajl ima drugačija imena tabova, uvoz za tu listu neće raditi — javi ako treba dodati još naziva ili prilagoditi kolonu.

## Povezivanje sa Google Sheets (alternativa)
Svaka lista ima polje "Link ka Google Sheets dokumentu" + dugme "Uvezi" — nalijepi link i aplikacija povuče sadržaj direktno iz dokumenta (prepoznaje brojeve markica isto kao i kod ručnog kopiranja).

Uslov: dokument mora biti dijeljen kao **"Bilo ko sa linkom — može pregledati"** (Share → General access → Anyone with the link → Viewer). Radi i običan link iz adresne trake (npr. `.../edit?gid=123...`) — aplikacija ga sama pretvori u ispravan format za čitanje. Ako lista ima više tabova (sheets), uvozi se onaj tab koji je otvoren u linku (prema `gid` parametru).

Zadnji korišteni link se pamti po listi (localStorage), pa je sljedeći put dovoljno samo kliknuti "Uvezi" ponovo za osvježavanje.

Ako uvoz ne uspije, provjeri dijeljenje dokumenta ili prekopiraj podatke ručno u polje.

## Štampanje izvještaja
Nakon "Uporedi liste", dugme "Štampaj izvještaj" otvara standardni dijalog za štampu (ili "Save as PDF") sa čistim izgledom: samo zaglavlje, sažetak i liste podudarnih/neusklađenih markica — bez tekstualnih polja i dugmadi.
