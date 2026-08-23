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
- upozorenjem ako neki red ima markicu u neprepoznatom obliku (očekuje se
  "BA" + brojevi) — taj red se preskoči i broji, isto kao kod uvoza u web
  aplikaciju.

List je oblikovan u istoj paleti boja i fontovima kao web aplikacija (tamni
"ink" naslov sa zlatnom trakom ispod, kartice sa statistikom u boji, list
dobija i zlatnu boju jezička) — mrežne linije su sakrivene i zamijenjene
vlastitim ivicama, zaglavlje tabele i prva kolona (Markica) ostaju
zamrznuti dok se skrola kroz duži spisak.

Pokreni ponovo kad god se Stanje ili Vakcinisano promijene — list "Uporedba
markica" se svaki put potpuno osvježi (staro se briše i piše iznova), pa je
sigurno pokretati koliko god puta treba.

## Prepoznavanje listova i kolona

Isto kao u web aplikaciji: listovi se prvo pokušaju prepoznati po **nazivu**
(Podaci/Vlasnik, Stanje/Roster/Grla, Vakcinisano), a ako to ne uspije (npr.
fajl ima generičke nazive "Table 1/2/3"), po **sadržaju zaglavlja** (prvog
reda). Kolone unutar listova se prepoznaju po **nazivu u zaglavlju** (npr.
"Šifra ušne markice", "Pol"/"Spol", "Bruceloza"), ne po fiksnoj poziciji —
raspored kolona može biti bilo kakav. Markica zapisana u dvije kolone
(Država + broj) i markica sa ili bez razmaka unutar oznake se prepoznaju
isto kao jedna te ista.

## Napomena

Skripta radi isključivo unutar ovog Google Sheets fajla (Apps Script je
"bound" na fajl) — ne šalje ništa na internet niti čita druge fajlove.
