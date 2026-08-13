# Usporedba spiskova markica — Poljoprivredni zavod USK — PWA

## Šta je unutra
- `index.html` — sama aplikacija (radi i offline, čuva podatke lokalno na uređaju preko localStorage)
- `manifest.json` — omogućava instalaciju kao aplikacija (desktop i mobitel)
- `sw.js` — service worker, keširа fajlove za offline rad
- `icons/` — ikone aplikacije
- `vendor/` — Leaflet (biblioteka za kartu, BSD-2 licenca, uključena lokalno da radi i bez interneta)

## Tabovi u aplikaciji
1. **Usporedba markica** — poređenje dva spiska ušnih markica (uvoz iz Excela ili Google Sheetsa, izvoz i štampa)
2. **Gazdinstva** — evidencija farmi i pčelara (podtabovi **Farme** i **Pčelari**)
3. **Karta korisnika usluga** — sva gazdinstva na mapi, obojena po statusu posjete

## Gazdinstva (Farme / Pčelari / Sve)
Za svako gazdinstvo se unosi:
- vrsta (farma / pčelar), gazdinstvo, vlasnik, telefon
- grad, adresa, ID gazdinstva (JIB)
- **broj grla** (za farme) odnosno **broj košnica** (za pčelare) — polje samo mijenja naziv prema vrsti
- vrsta i pasmina životinja (za pčelare: vrsta pčela / tip košnica)
- dan posjete, dan iduće posjete, napomena
- **ostale činjenice** — vlastita polja gdje sam upišeš naziv i vrijednost (npr. "Nadmorska visina: 640 m"), koliko god ih treba po gazdinstvu

Podtabovi **Farme**, **Pčelari** i **Sve** filtriraju spisak po vrsti; u pogledu "Sve" tabela dobija i kolonu Vrsta. Unosi se mogu uređivati, brisati, izvesti u CSV i štampati. Telefon je klikabilan — na mobitelu pokreće poziv.

### Pretraga i filteri
Iznad tabele su:
- **pretraga** — traži kroz sve podatke unosa, uključujući telefon, ID, pasminu, napomenu i vlastita polja
- **filter po gradu** — lista se sama puni gradovima koji postoje u podacima
- **filter po statusu** — treba u pregled / uskoro / obavljeno
- **Očisti** — poništava sve odjednom

Izvoz u CSV izvozi tačno ono što je trenutno prikazano, pa filtrirani spisak daje filtriran fajl.

**Svaki sačuvani unos automatski završava na Karti** — aplikacija u pozadini potraži koordinate za unesenu adresu (preko OpenStreetMap Nominatim servisa) i postavi gazdinstvo na mapu.

## Karta korisnika usluga
Boje markera se računaju automatski iz datuma:
- 🟢 **Obavljen pregled** — iduća posjeta je više od 14 dana daleko (ili je posjeta obavljena, a nova nije zakazana)
- 🟡 **Pregled uskoro** — iduća posjeta je u narednih 14 dana
- 🔴 **Treba otići u pregled** — iduća posjeta je prošla, ili gazdinstvo još nije posjećeno

Slovo u markeru: **F** = farma, **P** = pčelar. Filteri iznad karte prikazuju samo farme / samo pčelare, i samo odabrani grad. Klik na marker otvara sve podatke gazdinstva (kontakt, broj grla ili košnica, termine, ostale činjenice).

Ako adresa nije pronađena, gazdinstvo se izlistava ispod karte pod "Bez lokacije" — tada:
- klikni **"Pronađi lokacije koje nedostaju"** da se pokuša ponovo, ili
- dopuni precizniju adresu u tabu Gazdinstva.

**Marker se može uhvatiti i prevući** na tačnu lokaciju — ta pozicija se pamti i ostaje čak i ako kasnije izmijeniš adresu.

Napomena: karta i traženje adresa zahtijevaju internet (učitavaju se mape sa OpenStreetMapa). Sve ostalo — unos, tabela, izvoz, štampa — radi i offline; već pronađene lokacije se pamte na uređaju.

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
