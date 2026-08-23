# Bitne stavke — Markice USK

## Planirano, još nije urađeno

- **Zajednička baza podataka** (npr. Supabase) — trenutno svaki korisnik ima svoje odvojene podatke na svom uređaju (vidi napomenu ispod). Prava zajednička baza bi omogućila da svi vide iste podatke uživo, umjesto ručnog izvoza/uvoza sigurnosne kopije.

## Nedavno urađeno

- **Potvrde veterinarske stanice (slika + OCR, ili ručni unos)** — u obrascu gazdinstva, slika bilo koje od tri potvrde (mjere, stanje, popis vakcinisanih) se odmah čita OCR-om (potpuno lokalno, bez interneta) i predloži podatke — sve izmjenjivo prije snimanja; ili unesi ručno bez slike.
- **Markice po gazdinstvu** — tab Markice (samo farme, ne pčelari): izaberi ili dodaj farmu, pa uporedi spisak grla na imanju sa spiskom vakcinisanih od veterinara. Oba spiska su tabele (markica, pol, vrsta — vakcinisani spisak i uz to 5 kolona bolesti: Bruceloza/Enzotska leukoza/TBC/CMT/Antrax), popunjive ručno, preko OCR slike ili uvozom iz Excela; sačuvaj spisak trajno uz gazdinstvo. Ranije postojeće poređenje "cijele oblasti" odjednom (zajedno sa pretragom markice po broju i uvozom ugrađenog fajla) je ukinuto — sve ide po gazdinstvu.
- **Fotografije sa terena** — dodavanje fotografija uz gazdinstvo (automatski smanjene radi uštede prostora), sa sličicom u tabeli, na karti i u obrascu.
- **Pravi .xlsx izvoz** — svi izvozi (gazdinstva, dnevnik, registar posjeta, neusklađene markice) sada daju pravi Excel dokument umjesto CSV-a.
- **Ruta obilaska na karti** — dugme "Napravi rutu obilaska" poređa prikazana gazdinstva po najbližem susjedu (od tvoje lokacije ili od prvog gazdinstva), sa numerisanim markerima, linijom obilaska i spiskom zaustavljanja za štampu.
- **Provjera bugova tab po tab** — najbitnije: uređivanje gazdinstva se sad jasno vizuelno razlikuje od dodavanja novog (zlatni okvir, značka "Uređivanje", dugme "Otkaži uređivanje") jer je ranije bilo lako, bez upozorenja, prepisati postojeće gazdinstvo umjesto dodati novo. Popravljeno i: gazdinstvo koje je posjećeno ali nema zakazan sljedeći termin je nestajalo iz Pregleda; svi datumi u aplikaciji su na dijelu uređaja tiho prikazivali sirovi ISO oblik (2026-01-01) umjesto bosanskog (01.01.2026.).

## Kako sistem radi — važno da se zna

- **Svi podaci su samo na uređaju** (localStorage u pregledniku) — nema servera, nema automatske sinhronizacije između uređaja ili korisnika. Ko god koristi aplikaciju na svom telefonu/računaru ima svoju odvojenu kopiju podataka.
- Zbog toga: **redovno praviti sigurnosnu kopiju** — tab **Postavke → Izvezi sve podatke**. Bez toga, kvar uređaja ili brisanje podataka preglednika znači nepovratan gubitak.
- Prvi (ugrađeni) korisnik: **Nedžad**, PIN **2201**, uloga administrator. Administrator dodaje ostale korisnike u tabu Postavke.
- Prijava/PIN je evidencija odgovornosti (ko je šta unio/izmijenio), **ne** prava zaštita podataka — vidi napomenu u README.md.

## Gdje pogledati detalje

Kompletna dokumentacija svih tabova i funkcija je u `README.md`.
