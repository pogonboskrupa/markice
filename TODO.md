# Bitne stavke — Markice USK

## Planirano, još nije urađeno

- **Ruta obilaska na karti** — numerisan/optimalan redoslijed posjeta za dati dan, direktno na karti.
- **Zajednička baza podataka** (npr. Supabase) — trenutno svaki korisnik ima svoje odvojene podatke na svom uređaju (vidi napomenu ispod). Prava zajednička baza bi omogućila da svi vide iste podatke uživo, umjesto ručnog izvoza/uvoza sigurnosne kopije.

## Nedavno urađeno

- **Povezivanje markica sa gazdinstvom** — pretraga markice po broju (tab Markice) i klikabilni rezultati poređenja odmah pokazuju kojem gazdinstvu markica pripada.
- **Fotografije sa terena** — dodavanje fotografija uz gazdinstvo (automatski smanjene radi uštede prostora), sa sličicom u tabeli, na karti i u obrascu.
- **Pravi .xlsx izvoz** — svi izvozi (gazdinstva, dnevnik, registar posjeta, neusklađene markice) sada daju pravi Excel dokument umjesto CSV-a.

## Kako sistem radi — važno da se zna

- **Svi podaci su samo na uređaju** (localStorage u pregledniku) — nema servera, nema automatske sinhronizacije između uređaja ili korisnika. Ko god koristi aplikaciju na svom telefonu/računaru ima svoju odvojenu kopiju podataka.
- Zbog toga: **redovno praviti sigurnosnu kopiju** — tab **Postavke → Izvezi sve podatke**. Bez toga, kvar uređaja ili brisanje podataka preglednika znači nepovratan gubitak.
- Prvi (ugrađeni) korisnik: **Nedžad**, PIN **2201**, uloga administrator. Administrator dodaje ostale korisnike u tabu Postavke.
- Fajl **`Potvrda o stanju grla.xlsx`** se sam učitava u tab Markice pri svakom pokretanju — da se ažurira za sve, zamijeniti taj fajl u repozitoriju i ponovo deployati.
- Prijava/PIN je evidencija odgovornosti (ko je šta unio/izmijenio), **ne** prava zaštita podataka — vidi napomenu u README.md.

## Gdje pogledati detalje

Kompletna dokumentacija svih tabova i funkcija je u `README.md`.
