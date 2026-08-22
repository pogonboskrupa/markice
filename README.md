# Usporedba spiskova markica — Poljoprivredni zavod USK — PWA

## Šta je unutra
- `index.html` — sama aplikacija (radi i offline, čuva podatke lokalno na uređaju preko localStorage)
- `manifest.json` — omogućava instalaciju kao aplikacija (desktop i mobitel)
- `sw.js` — service worker, keširа fajlove za offline rad
- `icons/` — ikone aplikacije
- `vendor/` — Leaflet (biblioteka za kartu, BSD-2 licenca) i Tesseract.js (OCR biblioteka za čitanje potvrda, Apache-2.0 licenca) — obje uključene lokalno da rade i bez interneta
- `TODO.md` — šta je planirano a još nije urađeno, i najvažnije napomene o tome kako podaci žive u aplikaciji

## Prijava i korisnici
Aplikacija traži prijavu pri otvaranju. Prvi korisnik je već ugrađen:

| Korisnik | PIN | Uloga |
|---|---|---|
| **Nedžad** | **2201** | administrator |

Administrator u tabu **Korisnici** dodaje nove korisnike, dodjeljuje im PIN (4–10 cifara), mijenja PIN i briše korisnike. Obični korisnici unose i mijenjaju podatke, ali ne vide tab Korisnici.

Zaštite: PIN se nikad ne čuva u čitljivom obliku (PBKDF2, 150.000 iteracija, sa nasumičnim saltom po korisniku), nakon 5 pogrešnih pokušaja prijava se zaključava na minutu, ne može se obrisati korisnik pod kojim si prijavljen niti zadnji administrator.

> ⚠️ **Šta ova prijava jeste, a šta nije.** Cijela aplikacija radi u browseru i svi podaci su u `localStorage` samog uređaja. Prijava služi da se **zna ko je šta unio i izmijenio** među kolegama koji dijele uređaj — to je evidencija odgovornosti, a ne zaštita podataka. Nekome ko namjerno želi zaobići aplikaciju (kroz razvojne alate browsera) podaci su i dalje dostupni, a PIN od 4 cifre ima samo 10.000 kombinacija. Ako podaci trebaju stvarnu zaštitu, potreban je server sa pravim nalozima — to mogu dodati ako zatreba.

Zaključaj i sam uređaj (PIN/otisak na telefonu ili laptopu) — to je u ovoj postavci najjača stvarna zaštita.

## Vlastita tastatura
Aplikacija ima svoju vlastitu tastaturu (u stilu "papir i tinta" kao i ostatak aplikacije) koja se otvara na dnu ekrana čim dodirneš/klikneš bilo koje polje za unos teksta — sistemska tastatura se ne pojavljuje. Dva oblika:
- **puna slovna tastatura** (raspored kao QWERTZ, sa č ć ž š đ) — za nazive, adrese, napomene, pretrage i slično. Dugme ⇧ velikim slovom piše samo sljedeće slovo (kao na mobitelu), ⌫ briše, tekstualna polja (npr. Napomena) imaju i dugme ⏎ za novi red.
- **brojčana tastatura** (raspored kao na telefonu) — za PIN i brojčana polja (npr. broj grla/košnica).

Datumska polja, izbor fajla, čekboksi i padajuće liste zadržavaju svoje uobičajene kontrole (nisu "tastatura" u pravom smislu). Lijepljenje iz clipboard-a (npr. cijele kolone markica iz Excela) i dalje radi normalno.

Napomena: kako sistemska tastatura nikad ne iskače, prijedlozi za automatsko dovršavanje grada/vrste stoke iz browsera se ne prikazuju (polje se i dalje može popuniti kucanjem preko vlastite tastature), a osoba koja unos radi isključivo fizičkom tastaturom bez dodira/klika na polje neće moći kucati direktno — treba dodirnuti/kliknuti polje da se otvori vlastita tastatura.

## Šihtarica (lični radni dnevnik)
Tab **Šihtarica** je lični radni dnevnik prijavljenog korisnika — svako vidi samo svoje zapise, niko tuđe (ni administrator). Služi za planiranje i evidenciju vlastitog terena, ne za odgovornost/kontrolu (za to služi Dnevnik izmjena, ispod).

Dva načina unosa:
- **ručna bilješka** — slobodan tekst uz datum (npr. "Teren: 3 gazdinstva u Cazinu"), dugme "Dodaj bilješku"
- **preuzimanje zakazane posjete** — kod gazdinstva koje ima zakazan "dan iduće posjete", dugme **"+ U moju šihtaricu"** (u obrascu za uređivanje gazdinstva) ili **"+ Šihtarica"** (u redu na Pregledu) doda taj termin u šihtaricu, sa datumom posjete i nazivom gazdinstva. Ne može se dodati dvaput.

Zapisi su grupisani po danu, sa oznakom je li riječ o bilješci ili preuzetoj posjeti; posjeta ima dugme "Otvori" koje vodi pravo na to gazdinstvo, svaki zapis se može i obrisati. Filter po mjesecu, izvoz u Excel i štampa su tu isto dostupni — sve poštuje odabrani mjesec.

## Dnevnik izmjena
Podtab **Dnevnik izmjena** u Postavkama hronološki bilježi svaku radnju: ko se prijavio/odjavio, ko je dodao, izmijenio ili obrisao gazdinstvo, ko je pomjerio lokaciju na karti i ko je dodao ili obrisao korisnika. Kod izmjena se vidi i **tačno koje polje je promijenjeno i iz čega u šta** (npr. `Broj grla/košnica: "520" → "545"`).

Dnevnik se može pretraživati, filtrirati po korisniku i po danu, izvesti u Excel i odštampati — izvoz i štampa poštuju trenutne filtere, isto kao kod gazdinstava i posjeta. Uz to, svaki red u spisku gazdinstava i svaki marker na karti pokazuju „Unio: … / Izmijenio: …". Dnevnik čuva zadnjih 2000 zapisa.

## Tabovi u aplikaciji
1. **Pregled** — prvi ekran nakon prijave: gazdinstva kojima je pregled istekao ili predstoji, po danima i gradovima
2. **Gazdinstva** — evidencija farmi i pčelara (podtabovi **Farme**, **Pčelari**, **Sve**)
3. **Karta** — sva gazdinstva na mapi, obojena po statusu posjete
4. **Markice** — poređenje dva spiska ušnih markica (uvoz iz Excela ili Google Sheetsa, izvoz i štampa)
5. **Posjete** — registar obavljenih posjeta po mjesecima i po korisniku
6. **Šihtarica** — lični radni dnevnik prijavljenog korisnika (bilješke + preuzete zakazane posjete)
7. **Postavke** — sigurnosna kopija podataka i Dnevnik izmjena (svima), upravljanje korisnicima (samo administratoru)

## Gazdinstva (Farme / Pčelari / Sve)
Za svako gazdinstvo se unosi:
- vrsta (farma / pčelar), gazdinstvo, vlasnik, telefon
- grad, adresa (ulica/zaselak i kućni broj su odvojena polja — tačniji unos i preciznije geokodiranje), ID gazdinstva (JIB)
- **stoka prijavljena za poticaje** — broj grla/košnica koji se evidentira je broj sa apliciranja korisnika za poticaje (od njega zavisi visina poticaja), ne nužno trenutno stvarno stanje na terenu. Sekcija se prilagođava vrsti gazdinstva: za farme je to "Grla prijavljena za poticaje" sa prijedlozima goveda/ovce/koze/konji/svinje/živina, za pčelare "Košnice prijavljene za poticaje" sa prijedlozima tipova košnica (LR, Standard, AŽ) — bez miješanja jednih i drugih. Dugme "+ Dodaj..." dodaje red (slobodan tekst uz prijedloge, može i vlastita vrsta/tip); kod pčelara odmah upiše "Košnice" da ne mora ručno. Za svaku vrstu se unosi broj i, opciono, **ID brojevi / markice** — jedan po redu. Gazdinstvo može imati koliko god vrsta, svaka sa svojim brojem i markicama.
- dan iduće posjete, napomena
- **obavljene posjete** — dugme "Zabilježi posjetu" dodaje red sa datumom, kolegom koji je bio na terenu (opciono) i nalazom; gazdinstvo može imati koliko god posjeta, sve ostaju u historiji (ništa se ne briše/prepisuje). Tok podataka: pri unosu gazdinstva upisuje se broj grla/košnica **sa prijave za poticaje**; "Nalaz" kod posjete je **zapisnik sa terena** — tu se bilježi stvarno utvrđeno stanje ako se pri provjeri razlikuje od prijavljenog.
- **fotografije sa terena** — dugme "+ Dodaj fotografiju" (radi i sa kamerom na mobitelu). Slika se prije čuvanja automatski smanji (najviše 1000px, JPEG) da ne troši previše prostora — vidi napomenu o localStorage ispod. Prva fotografija se prikazuje kao mala sličica u tabeli i na karti; klik na nju otvara sliku u punoj veličini.
- **potvrde veterinarske stanice** — vidi poglavlje "Potvrde veterinarske stanice (slika + OCR)" ispod
- **ostale činjenice** — vlastita polja gdje sam upišeš naziv i vrijednost (npr. "Nadmorska visina: 640 m"), koliko god ih treba po gazdinstvu

Podtabovi **Farme**, **Pčelari** i **Sve** filtriraju spisak po vrsti; u pogledu "Sve" tabela dobija i kolonu Vrsta. Unosi se mogu uređivati, brisati, izvesti u Excel i štampati. Telefon je klikabilan — na mobitelu pokreće poziv. Grad/adresa je klikabilna i otvara lokaciju u Google Maps (u tabeli, na Pregledu i u popup-u na karti).

Stariji unosi koji imaju samo jedno polje "broj grla" i "pasmina" (prije nego je dodana ova podjela po vrstama) i dalje se prikazuju ispravno — čim se takav unos otvori za uređivanje i sačuva, automatski dobija novu strukturu.

### Pretraga i filteri
Iznad tabele su:
- **pretraga** — traži kroz sve podatke unosa, uključujući telefon, ID, vrste stoke, ID brojeve/markice, napomenu i vlastita polja
- **filter po gradu** — lista se sama puni gradovima koji postoje u podacima
- **filter po statusu** — treba u pregled / uskoro / obavljeno
- **Očisti** — poništava sve odjednom

Izvoz u Excel izvozi tačno ono što je trenutno prikazano, pa filtrirani spisak daje filtriran fajl. "Štampaj spisak" štampa tu istu (filtriranu) tabelu.

### Profil gazdinstva za štampu
Dok je gazdinstvo otvoreno za uređivanje, dugme **"Štampaj profil"** (pored "Sačuvaj izmjene") daje jedan uredan list sa svim podacima o TOM gazdinstvu — posebno zaglavlje sa pečatom, osnovni podaci (vlasnik, telefon, adresa, ID, status), tabela stoke sa markicama, kompletna historija posjeta, ostale činjenice i napomena. Za razliku od "Štampaj spisak" (cijela tabela, jedan red po gazdinstvu), ovo je pogodno za predaju vlasniku ili arhivu jednog dosjea.

**Svaki sačuvani unos automatski završava na Karti** — aplikacija u pozadini potraži koordinate za unesenu adresu (preko OpenStreetMap Nominatim servisa) i postavi gazdinstvo na mapu.

## Potvrde veterinarske stanice (slika + OCR)
U obrascu gazdinstva, dugmad **"+ Slika: Potvrda o provedenim mjerama"** i **"+ Slika: Potvrda o stanju životinja"** dodaju sliku odgovarajuće potvrde (foto ili uvoz sa uređaja). Aplikacija odmah pročita tekst sa slike (OCR — prepoznavanje teksta) **potpuno lokalno u pregledniku**, bez slanja bilo čega na internet, i predloži izvučene podatke:

- **Potvrda o provedenim mjerama** (vakcinacija) — pokušava prepoznati vlasnika, broj imanja, bolest, vrstu životinja, ukupan broj životinja i datum vakcinacije.
- **Potvrda o stanju životinja** — pokušava prepoznati šifru imanja, datum izdavanja, i **spisak svih pojedinačnih markica** iz tabele (isto prepoznavanje formata kao kod uvoza liste u tabu Markice).

**OCR nikad nije savršen** — sva izvučena polja i spisak markica su prijedlog u običnim poljima za unos, potpuno izmjenjiv prije snimanja gazdinstva (dodaj/ukloni polje, ispravi bilo koju vrijednost). Sirovi OCR tekst ostaje dostupan ispod (razvij "Sirovi OCR tekst") za ručnu provjeru kad prepoznavanje omane. Za "Potvrdu o stanju", provjerenu listu markica prekopiraj u polje "ID brojevi / markice" kod odgovarajuće vrste stoke da uđe u evidenciju i u poređenja u tabu Markice.

Gazdinstvo može imati koliko god potvrda obje vrste (npr. iz različitih godina) — ništa se ne briše/prepisuje, svaka ostaje uz svoju sliku i datum. OCR biblioteka (Tesseract.js) je uključena lokalno u `vendor/tesseract/` — prvi put kad se potvrda doda, preglednik preuzme ~7 MB (jednom, pa ostaje keširano za offline rad).

## Karta korisnika usluga
Boje markera se računaju automatski iz datuma:
- 🟢 **Obavljen pregled** — iduća posjeta je više od 14 dana daleko (ili je posjeta obavljena, a nova nije zakazana)
- 🟡 **Pregled uskoro** — iduća posjeta je u narednih 14 dana
- 🔴 **Treba otići u pregled** — iduća posjeta je prošla, ili gazdinstvo još nije posjećeno

Slovo u markeru: **F** = farma, **P** = pčelar. Filteri iznad karte prikazuju samo farme / samo pčelare, i samo odabrani grad. Klik na marker otvara sve podatke gazdinstva (kontakt, broj grla ili košnica, termine, ostale činjenice).

Ako adresa nije pronađena, gazdinstvo se izlistava ispod karte pod "Bez lokacije na karti" — tu za svaki takav unos stoji:
- **"Postavi na karti"** — klikni dugme pa klikni tačno mjesto na mapi (npr. za zaseoke i manje precizne adrese koje automatsko prepoznavanje ne pogodi); traka iznad karte vodi kroz taj korak i nudi "otkaži" u svakom trenutku,
- ili gore, dugme **"Pronađi lokacije koje nedostaju"** da se pokuša automatsko prepoznavanje ponovo,
- ili dopuni precizniju adresu u tabu Gazdinstva.

Marker se **ne pomjera slobodnim prevlačenjem** (namjerno — slučajan dodir/klik na mobitelu bi ga lako pomjerio bez da se primijeti). Za ispravku lokacije, klikni marker pa dugme **"Pomjeri lokaciju"** u popup-u — isti režim biranja kao za gazdinstva bez lokacije (klikni tačno mjesto na karti). Postavljena pozicija se pamti i ostaje čak i ako kasnije izmijeniš adresu.

Dugme **"Štampaj kartu"** štampa trenutni prikaz karte (poštuje filtere po vrsti/gradu) sa legendom i spiskom "Bez lokacije" ako postoji.

Napomena: karta i traženje adresa zahtijevaju internet (učitavaju se mape sa OpenStreetMapa). Sve ostalo — unos, tabela, izvoz, štampa — radi i offline; već pronađene lokacije se pamte na uređaju.

### Ruta obilaska
Dugme **"Napravi rutu obilaska"** poređa trenutno prikazana gazdinstva (poštuje filtere po vrsti i gradu) po principu "najbliži sljedeći" — počevši od tvoje trenutne lokacije (ako preglednik dozvoli pristup) ili, ako ne, od prvog gazdinstva na spisku. Markeri na karti dobiju brojeve umjesto slova, poveže ih isprekidana linija, a ispod karte se ispiše spisak zaustavljanja po redoslijedu (sa klikabilnom adresom i dugmetom "Otvori" za svaki unos).

Klik na "Otvori" ne prekida rutu — možeš pogledati ili urediti gazdinstvo i vratiti se na kartu, ruta ostaje. Promjena filtera po vrsti/gradu, dodavanje/brisanje gazdinstva ili traženje lokacija poništi trenutnu rutu (jer se spisak zaustavljanja promijenio) — dugme "Ukloni rutu" je isto uvijek dostupno za ručno poništavanje. "Štampaj rutu" daje čist spisak za poneti na teren.

## Pregled (plan obilaska)
Prvi tab nakon prijave. Grupiše gazdinstva u:
- **Kasni** — rok za iduću posjetu je prošao
- **Ove sedmice** — iduća posjeta u narednih 7 dana
- **Naredne dvije sedmice** — u narednih 8–14 dana
- **Bez zakazane posjete** — nikad posjećeno i ništa zakazano

Dugme "Otvori" na svakom redu vodi pravo na uređivanje tog gazdinstva. "Štampaj plan obilaska" daje čist spisak za poneti na teren.

## Posjete (registar po mjesecima)
Sve posjete iz svih gazdinstava, sabrane na jedno mjesto i grupisane po mjesecu (najnoviji mjesec prvi). Za svaku posjetu se vidi gazdinstvo (kod koga), korisnik koji je bio, kolega (ako je bio s nekim), i nalaz.

Filter po korisniku se **pri otvaranju tabа sam postavi na tebe** — svako prvo vidi svoj registar, a filter lako prebaciš na kolegu ili na "Svi korisnici" da vidiš sve zajedno. Ima i filter po mjesecu i pretragu kroz sve podatke. Izvoz u Excel i štampa poštuju trenutne filtere.

## Postavke i sigurnosna kopija
> ⚠️ **Najvažnije poglavlje ovog README-a.** Svi podaci (gazdinstva, posjete, korisnici, dnevnik) žive **samo u ovom pregledniku, na ovom uređaju**. Nema servera, nema sinhronizacije. Ako se uređaj pokvari, izgubi, ili neko obriše podatke preglednika (ili instalira aplikaciju iznova) — **sve nestaje bez mogućnosti povrata**, osim ako postoji kopija.

Tab **Postavke** ima dva podtaba: **Postavke** (opšte) i **Dnevnik izmjena** (vidi poglavlje iznad).

Podtab Postavke je dostupan svim korisnicima i sadrži:
- **"Izvezi sve podatke"** — preuzima jedan `.json` fajl sa svime (gazdinstva, korisnici, dnevnik, liste, sačuvane lokacije). Radi ovo redovno — poslije svakog dana rada na terenu je razumno.
- **"Uvezi iz kopije"** — vraća stanje iz takvog fajla. Traži potvrdu jer **briše sve trenutno na uređaju** prije nego što vrati podatke iz kopije. Ako se tvoj trenutni korisnik (po imenu) ne nalazi u vraćenoj kopiji, tražit će se ponovna prijava.
- Ispod dugmadi piše koliko prostora podaci trenutno zauzimaju.

Upravljanje korisnicima (dodavanje, PIN) ostaje u istom tabu, ali vidljivo samo administratoru — vidi poglavlje "Prijava i korisnici" gore.

**Preporuka:** kopiju s vremena na vrijeme pošalji sebi mailom ili je sačuvaj na Google Drive / OneDrive, van samog uređaja. Ako više korisnika treba da dijeli iste podatke uživo (ne preko kopije), sljedeći korak je prava zajednička baza (npr. Supabase) — to je veći zahvat i radi se posebno, kad zatreba.

## Deploy na Netlify (najbrže)
1. Idi na https://app.netlify.com/drop
2. Prevuci cijeli ovaj folder (ne pojedinačne fajlove, nego folder) u prozor na stranici
2. Netlify će ti odmah dati link tipa `https://nešto-random.netlify.app`
3. Otvori taj link na mobitelu/desktopu — browser će ponuditi "Instaliraj aplikaciju" ili "Dodaj na početni ekran"

Kasnije, ako želiš stalniji domen, možeš napraviti besplatan Netlify nalog i povezati ovaj folder trajno (ili ga povezati sa GitHub repozitorijem za automatski redeploy).

## Nova verzija poslije deploya
Kad se aplikacija ponovo deployuje, korisnici koji je već imaju otvorenu (ili instaliranu) **ne moraju ništa brisati** — aplikacija sama primijeti novu verziju (odmah pri sljedećem otvaranju, ili dok je otvorena, kad se vrati u fokus) i na vrhu ekrana pokaže traku "Dostupna je nova verzija aplikacije" sa dugmetom **Osvježi**. Dok se dugme ne klikne, trenutna sesija normalno nastavlja raditi sa starom verzijom — ništa se ne prekida usred unosa. Klik učita novu verziju i sesija (prijava) ostaje ista, ne treba se ponovo prijavljivati.

Ovo je urađeno na nekoliko nivoa odjednom, jer preglednici inače vole zadržati staru kopiju bar na jednom od njih:
- `CACHE_NAME` u `sw.js` i `APP_VERZIJA` u `index.html` se podignu zajedno pri svakom deployu koji mijenja kod — to je ono što uopšte tjera keš (Cache Storage) aplikacije da se osvježi.
- Service worker pri instalaciji sam zaobilazi keš preglednika za svaki fajl koji preuzima (`{cache:'reload'}`), i registruje se sa `updateViaCache:'none'` — bez toga bi preglednik znao zadržati staru kopiju `sw.js`-a čak i kad je na serveru nova.
- Fajl `_headers` govori Netlify-ju (ili bilo kojem hostingu koji ga poštuje) da `index.html`, `sw.js` i `manifest.json` nikad ne kešira na nivou CDN-a/HTTP-a.
- Nova verzija se ne nameće automatski — čeka klik na "Osvježi", da se ne izgubi ništa što je korisnik usred kucanja.

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

## Automatsko učitavanje spiska
Fajl **`Potvrda o stanju grla.xlsx`** stoji uz aplikaciju i **učitava se sam pri svakom pokretanju** — obje liste su popunjene čim se prijaviš, bez ijednog klika.

Čim uvezeš vlastiti fajl ili sam nešto upišeš u liste, tvoj unos ima prednost: pamti se na uređaju i vraća se pri sljedećem otvaranju, a ugrađeni fajl ga više ne prepisuje. Dugme **"Vrati ugrađeni fajl"** vraća na fajl koji dolazi uz aplikaciju (traži potvrdu, jer briše trenutni sadržaj obje liste).

Ispod dugmadi uvijek piše odakle su trenutni podaci i kada su učitani.

Da ažuriraš ugrađeni spisak za sve korisnike, zamijeni `Potvrda o stanju grla.xlsx` u repozitoriju novim izvozom i ponovo deployaj.

## Uvoz iz Excel fajla
Dugme "Uvezi .xlsx" učitava obje liste odjednom iz jednog Excel dokumenta — direktno na uređaju, bez ikakvog slanja na internet ili servera.

Aplikacija očekuje dokument sa dva taba tačno ovako nazvana:
- **Vakcinacija (Bruceloza)** → Lista 1 (Popis identifikacionih oznaka)
- **Potvrda o Stanju Životinja** → Lista 2 (Potvrda o stanju životinja)

Iz svakog taba čita se kolona B (šifra/identifikacijski broj životinje); naslovni i "Ukupno evidencija" redovi se automatski ignorišu. Ako fajl ima drugačija imena tabova, uvoz za tu listu neće raditi — javi ako treba dodati još naziva ili prilagoditi kolonu.

## Izvoz u Excel (.xlsx)
Svako dugme "Izvezi (Excel)" (gazdinstva, dnevnik izmjena, registar posjeta, neusklađene markice) preuzima pravi `.xlsx` dokument koji se otvara direktno u Excelu, LibreOffice-u ili Google Sheetsu — ne CSV. I čitanje i pisanje `.xlsx` fajlova je urađeno ručno (bez vanjske biblioteke poput SheetJS-a), jer jedina verzija te biblioteke dostupna preko npm-a ima poznate bezbjednosne ranjivosti. Fajl koji nastaje je minimalan ali ispravan OOXML dokument (ZIP arhiva bez kompresije + par XML dijelova), provjeren i ručno (otpakivanje ZIP-a) i učitavanjem kroz Python biblioteku za čitanje Excel fajlova.

## Povezivanje sa Google Sheets (alternativa)
Svaka lista ima polje "Link ka Google Sheets dokumentu" + dugme "Uvezi" — nalijepi link i aplikacija povuče sadržaj direktno iz dokumenta (prepoznaje brojeve markica isto kao i kod ručnog kopiranja).

Uslov: dokument mora biti dijeljen kao **"Bilo ko sa linkom — može pregledati"** (Share → General access → Anyone with the link → Viewer). Radi i običan link iz adresne trake (npr. `.../edit?gid=123...`) — aplikacija ga sama pretvori u ispravan format za čitanje. Ako lista ima više tabova (sheets), uvozi se onaj tab koji je otvoren u linku (prema `gid` parametru).

Zadnji korišteni link se pamti po listi (localStorage), pa je sljedeći put dovoljno samo kliknuti "Uvezi" ponovo za osvježavanje.

Ako uvoz ne uspije, provjeri dijeljenje dokumenta ili prekopiraj podatke ručno u polje.

## Štampanje izvještaja
Nakon "Uporedi liste", dugme "Štampaj izvještaj" otvara standardni dijalog za štampu (ili "Save as PDF") sa čistim izgledom: samo zaglavlje, sažetak i liste podudarnih/neusklađenih markica — bez tekstualnih polja i dugmadi.

## Povezivanje markica sa gazdinstvom
Svaka markica upisana uz stoku na nekom gazdinstvu (polje "ID brojevi / markice" u obrascu) automatski postaje pretraživa:

- U tabu **Markice**, iznad liste za poređenje, polje "Pretraga po broju markice" — ukucaj broj i odmah vidi kojem gazdinstvu pripada (ili poruku da nije pronađena).
- Nakon "Uporedi liste", svaka markica koja se poklapa sa nekim gazdinstvom je klikabilna i pokazuje naziv vlasnika direktno na "čipu"; klik otvara to gazdinstvo na uređivanje. Markice bez poznatog vlasnika ostaju obične (nisu klikabilne).

Poređenje formata brojeva (razmaci, mala/velika slova, novi red) je isto kao i kod uvoza liste, tako da se "BA 4201 111111" i "BA4201111111" prepoznaju kao ista markica.

### Treće poređenje — zvanični spiskovi naspram gazdinstava
Osim poređenja Liste 1 i Liste 2 međusobno, "Uporedi liste" pokazuje i gdje se zvanični spiskovi razilaze sa onim što je upisano po gazdinstvima:

- **"U spiskovima, bez upisanog vlasnika"** — markica postoji u Listi 1 i/ili Listi 2, ali nije upisana ni na jednom gazdinstvu. Treba pronaći i upisati vlasnika.
- **"Upisano na gazdinstvu, van spiskova"** — markica je upisana uz stoku na nekom gazdinstvu, ali se ne pojavljuje ni u jednoj od dvije zvanične liste (moguća greška u unosu, ili tek treba stići u zvanični spisak). Klikabilno, isto kao podudarne markice — klik otvara gazdinstvo.

I ove dvije kategorije ulaze u "Izvezi neusklađene (Excel)" (sa kolonom Gazdinstvo gdje je poznato) i u "Štampaj izvještaj".
