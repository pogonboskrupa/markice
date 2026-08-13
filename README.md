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
