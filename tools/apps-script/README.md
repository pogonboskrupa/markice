# Uporedba markica — Google Apps Script

Skripta za Google Sheets fajl vlasnika (isti format kao fajlovi koje čita web
aplikacija Markice USK, tab **Markice → Uvezi kompletan Excel fajl**): tri
lista — **Podaci** (vlasnik, adresa, šifra imanja), **Stanje** (spisak grla)
i **Vakcinisano** (spisak od veterinarske stanice, sa do 5 kolona
bolesti/mjera). Dodaje meni **Markice → "Uporedi / osvježi 'Uporedba
markica'"** koji upiše rekap sa statistikom i punu tabelu markica sa
statusom, direktno u sam Google Sheets fajl — bez potrebe za web
aplikacijom.

## Instalacija (jednom po fajlu)

1. Otvori Google Sheets fajl vlasnika (onaj sa listovima Podaci/Stanje/
   Vakcinisano — ili generičkim nazivima kao "Table 1/2/3" ako je fajl
   nastao izvozom iz drugog alata, radi i tako).
2. Meni **Extensions / Proširenja → Apps Script**.
3. U editoru koji se otvori, obriši sav sadržaj fajla `Code.gs` i zalijepi
   cijeli sadržaj [`uporedba-markica.gs`](./uporedba-markica.gs) iz ovog
   foldera.
4. Sačuvaj (Ctrl+S / disketa ikona gore lijevo), po želji nazovi projekat
   (npr. "Uporedba markica").
5. Vrati se u sam Sheets fajl i osvježi stranicu (F5). Kod prvog pokretanja
   Google traži odobrenje pristupa (skripta samo čita/piše u OVAJ fajl,
   ništa ne šalje van njega) — klikni kroz "Advanced/Napredno → Go to
   [naziv projekta] (unsafe)" ako se pojavi upozorenje za neverifikovane
   skripte (normalno za lične/interne skripte).
6. U meniju trake se pojavi novo dugme **Markice**.

## Korištenje

Meni **Markice → "Uporedi / osvježi 'Uporedba markica'"** — kreira (ili
osvježi, ako već postoji) list **Uporedba markica** sa:

- rekapom sa statistikom (broj grla na spisku, broj i postotak vakcinisanih,
  broj nevakcinisanih, broj vakcinisanih van spiska),
- punom tabelom markica (Markica, **Rb (Potvrda o stanju)**, Status, Pol,
  Vrsta, i po jedna kolona za svaku od 5 bolesti/mjera), obojenom isto kao u
  web aplikaciji — **zeleno** = vakcinisano, **crveno** = nije vakcinisano,
  **žuto** = vakcinisano ali nije na spisku grla (mogući višak/greška u
  unosu). Kolona **Rb** je redni broj tog grla onako kako stoji u koloni
  "Rb"/"Redni broj" na listu Stanje (Potvrda o stanju) — isti broj kao na
  originalnom listu, ne prebrojano iznova — da se grlo lakše pronađe tamo.
  Ako list nema tu kolonu, koristi se prirodna pozicija reda umjesto nje; za
  grlo koje se pojavljuje samo u spisku vakcinisanih (van spiska), Rb
  ostaje prazan jer ga nema na listu Stanje.
- **"Pregled po rasponima (Rb)"** — brz sažetak iznad detaljne tabele: brojevi
  grla grupisani u nizove uzastopnih Rb sa istim statusom, npr. "🟢
  Vakcinisano: 4–57, 78–134" i "🔴 Nije vakcinisano: 58–77". Raspon se
  prekida čim se status promijeni ili se pojavi rupa u brojevima (npr.
  preskočen/neispravan red) — ne treba čitati svaki red pojedinačno da bi se
  vidjelo grubo stanje spiska.
- **isti pregled po rasponima još jednom, ali za sam list Vakcinisano** — po
  NJEGOVOM vlastitom Rb (ne po Rb sa Stanja), grupisano na "🟢 Na spisku
  Stanje: 1–210" i "🟡 Van spiska (greška): 211–216" — brz uvid gdje na
  spisku vakcinisanih počinju upisi koji nemaju par na Stanju, bez
  prelistavanja glavne tabele.
- **bojenjem samog lista Stanje (Potvrda o stanju)** — pozadina cijelog reda
  svakog grla na tom listu se oboji svijetlo zeleno ako je vakcinisano, ili
  svijetlo crveno ako nije (samo pozadina, tekst ostaje nepromijenjen; redovi
  sa neprepoznatom markicom ostaju bez boje). Ne treba prebacivati na
  "Uporedba markica" da bi se vidjelo koje grlo nedostaje — vidi se odmah na
  originalnom listu. Boji se iznova pri svakom pokretanju (staro bojenje se
  prvo poništi), pa prati trenutno stanje bez ostataka od prošlog pokretanja,
- **bojenjem samog lista Vakcinisano** — pozadina cijelog reda se oboji
  svijetlo žuto (ista boja kao status "vakcinisano, van spiska" u "Uporedba
  markica") samo za grlo čija se markica NE nalazi na listu Stanje — moguća
  greška u unosu (višak, pogrešno prepisana markica). Grla koja JESU na
  Stanju ostaju bez boje, tako da se pažnja odmah usmjeri na ono što treba
  provjeriti, direktno na listu gdje je i upisano. Boji se iznova pri svakom
  pokretanju,
- **obilježavanjem ponovljene markice** — ako se ista markica pojavi dva ili
  više puta na istom listu (Stanje ili Vakcinisano posebno), svi ti redovi
  dobiju debeo **zlatan okvir** oko cijelog reda, povrh postojeće boje
  statusa (status i dalje ostaje vidljiv) — čest izvor grešaka (kopiran red,
  ista markica upisana za dva grla) inače prođe neopaženo jer se druga
  pojava samo tiho preskoči u poređenju. Poruka po završetku javlja i ukupan
  broj takvih redova,
- upozorenjem ako je kolona sa markicom prazna u nekom redu — taj red se
  preskoči i broji.

List je oblikovan u istoj paleti boja i fontovima kao web aplikacija (tamni
"ink" naslov sa zlatnom trakom ispod, kartice sa statistikom u boji — kartica
"Vakcinisano" ima i mali tekstualni bar ispod postotka, list dobija i zlatnu
boju jezička i postaje prvi jezičak u fajlu) — mrežne linije su sakrivene i
zamijenjene vlastitim ivicama (uz posebnu liniju koja odvaja "ko je grlo"
kolone od kolona bolesti). Skrolanje je standardno, bez zamrznutih
redova/kolona. Spisak grla ide redoslijedom Rb (kao na originalnoj Potvrdi
o stanju), ne abecedno po markici.

Pokreni ponovo kad god se Stanje ili Vakcinisano promijene — list "Uporedba
markica" se svaki put potpuno osvježi (staro se briše i piše iznova), pa je
sigurno pokretati koliko god puta treba.

## Starost u mjesecima

Meni **Markice → "Izračunaj starost u mjesecima (kolona H)"** — na listu
Stanje (Potvrda o stanju) upiše, u kolonu **H**, starost svakog grla u
mjesecima, izračunatu od datuma rođenja (kolona sa "rođenja" u zaglavlju, npr.
"Datum rođenja") do datuma koji sam izabereš kad te skripta pita (prazno =
današnji datum). Starost je zaokružena na najbliži cijeli mjesec. Zaglavlje u
H1 pokazuje na koji je datum starost izračunata (npr. "Starost (mjeseci) na
dan 04.05.2026."), pa se odmah vidi na koji dan trenutne vrijednosti važe.
Redovi bez prepoznatog datuma rođenja se preskoče i broje u poruci po
završetku, ostaju prazni u koloni H. List se svaki put ponovo prepiše u
koloni H, pa je sigurno pokretati opet sa drugim datumom.

## OCR sa slike (besplatno, eksperimentalno)

Meni **Markice → "OCR sa slike (besplatno, eksperimentalno)"** — pita te za
link (ili sam ID) fotografije/skena fizičkog obrasca koju prvo otpremiš na
svoj Google Drive (bilo gdje — ne mora biti u ovom fajlu). Slike umetnute
direktno preko ćelija na listu (Insert → Image) **ne rade** za ovo — Apps
Script nema pristup njihovom sadržaju, samo do fajlova na samom Drive-u.
Iz prepoznatog teksta skripta best-effort izdvoji Rb, markicu, pol i vrstu
za svaki red, i upiše to u poseban list **"OCR - pregled"** (zajedno sa
sirovom OCR linijom radi provjere). Ne piše direktno u Stanje ni
Vakcinisano — rezultat treba pregledati i po potrebi ispraviti, pa tek onda
ručno prepisati/zalijepiti u pravi list. OCR sa skeniranog/fotografisanog
obrasca nije 100% pouzdan (posebno rukopis), zato je ovo namjerno odvojen
korak za provjeru, ne automatski upis.

**Kako pribaviti link:** otpremi sliku na Drive (prevuci fajl u
drive.google.com, ili Datoteka → Otpremi u bilo kom folderu), zatim desni
klik na sliku → **Nabavi link/Get link** → Kopiraj link, i taj link
zalijepi kad te skripta pita.

Koristi besplatnu Google Docs OCR konverziju (ista tehnologija kao "Otvori
sa → Google Docs" na slici u samom Drive-u), bez ikakve naplate ili
posebnog API ključa — ali zahtijeva **jednokratno podešavanje** u Apps
Script editoru:

1. U Apps Script editoru (Extensions/Proširenja → Apps Script), lijevo u
   bočnoj traci klikni **Services/Usluge** (ikonica +).
2. Pronađi i dodaj **Drive API**, ostavi podrazumijevanu verziju, klikni
   **Add/Dodaj**.
3. Sačuvaj projekat (Ctrl+S).

Bez ovog koraka, meni javlja grešku sa uputom da prvo dodaš ovu uslugu.

Napomena o tačnosti: dobar je za jasan, otkucan tekst; znatno nepouzdaniji
za rukopis ili mutne/nakrivo fotografisane obrasce. Redni broj (Rb) se
traži bilo gdje PRIJE markice u istoj liniji (ne samo na samom početku) —
OCR zna izmiješati redoslijed kolona (npr. pročita "BA 12 BA 4200571224"
umjesto "12 BA 4200571224"), pa se Rb i dalje pronađe. Pol se traži kao
usamljeno slovo M/Ž, a vrsta poređenjem sa listom čestih naziva (Govedo,
Ovca, Koza, Jagnjad, Konj, Svinja...) — sve troje su samo nagađanja i treba
ih provjeriti. Markica se traži prvo u obliku "BA" + brojevi; ako OCR
pročita samo cifre bez slova (slova su na markici obično sitnija/svjetlija
pa se lakše izgube), ispred se automatski doda "BA" — fizička markica
skoro uvijek ima taj prefiks, pa je vjerovatnije da ga je OCR ispustio nego
da stvarno ne postoji (bitno i da se ovako izvučena markica poklopi sa
"BA..." zapisima na Stanje/Vakcinisano listovima pri poređenju). Linija
bez ičeg što liči na markicu se preskoči (ne upisuje se kao prazan red).

## Prepoznavanje listova i kolona

Isto kao u web aplikaciji: listovi se prvo pokušaju prepoznati po **nazivu**
(Podaci/Vlasnik, Stanje/Roster/Grla, Vakcinisano), a ako to ne uspije (npr.
fajl ima generičke nazive "Table 1/2/3"), po **sadržaju zaglavlja** (prvog
reda). Kolone unutar listova se prepoznaju po **nazivu u zaglavlju** (npr.
"Šifra ušne markice", "Pol"/"Spol", "Bruceloza"), ne po fiksnoj poziciji —
raspored kolona može biti bilo kakav. Markica zapisana u dvije kolone
(Država + broj) i markica sa ili bez razmaka unutar oznake se prepoznaju
isto kao jedna te ista.

Radi i kad je u oba lista unesena **samo markica**, bez ijedne druge kolone
(nema Pol/Vrsta/bolesti da bi se po sadržaju zaglavlja pogodilo koji je list
Stanje a koji Vakcinisano) — takva dva lista se dodijele različitim ulogama
umjesto da oba budu pogrešno prepoznata kao isto.

Na listu **Vakcinisano** (npr. "Vakcinisana Grla") — ako je Država i
Identifikacijski broj u dvije odvojene kolone (bilo po prepoznatljivom
zaglavlju, bilo direktno kolone **B i C** po poziciji kad zaglavlje uopšte
nije opisno), one se spoje samo **"u prolazu"**, isključivo za potrebe tog
poređenja (npr. "BA" + "42329525" → "BA42329525") — sam list se pritom **ne
mijenja**, raspored kolona ostaje kakav jeste i poslije pokretanja skripte.

## Napomena

Skripta radi isključivo unutar ovog Google Sheets fajla (Apps Script je
"bound" na fajl) — ne šalje ništa na internet niti čita druge fajlove.
