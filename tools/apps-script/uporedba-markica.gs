/**
 * Uporedba markica — Google Apps Script
 * ======================================
 * Bound skripta za Google Sheets fajl vlasnika (isti raspored kao fajlovi
 * veterinarskih stanica koje čita web aplikacija Markice USK): tri lista —
 * "Podaci" (vlasnik, adresa, šifra imanja — parametar/vrijednost), "Stanje"
 * (spisak grla na imanju) i "Vakcinisano" (spisak od veterinarske stanice,
 * sa do 5 kolona bolesti/mjera). Nazivi listova ne moraju biti tačni (fajl
 * izvezen iz Google Sheets zna dobiti generičke nazive "Table 1/2/3") —
 * uloga lista se prepozna po SADRŽAJU zaglavlja kad naziv ne pomogne, isto
 * kao u web aplikaciji. Kolone se prepoznaju po nazivu u zaglavlju, ne po
 * fiksnoj poziciji. Radi i kad je u oba lista unesena samo markica (bez
 * ijedne druge kolone). Na listu Vakcinisano (npr. "Vakcinisana Grla") — ako
 * je Država i Identifikacijski broj u dvije odvojene kolone (B i C), ili ako
 * markica uopšte nema prepoznatljiv naziv u zaglavlju, te dvije kolone se
 * spoje "u prolazu" samo za potrebe poređenja (npr. "BA" + "42329525" ->
 * "BA42329525") — sam list se pritom NE mijenja, izvorni raspored kolona
 * ostaje netaknut.
 *
 * Meni "Markice" > "Uporedi / osvježi" upiše rezultat u novi/postojeći list
 * "Uporedba markica": rekap sa statistikom (broj grla, broj i postotak
 * vakcinisanih, broj nevakcinisanih, broj vakcinisanih van spiska) i punu
 * tabelu markica sa statusom i po-bolest kolonama, obojenu isto kao u
 * aplikaciji (zeleno = vakcinisano, crveno = nije, žuto = vakcinisano ali
 * van spiska grla). Svako grlo iz spiska nosi i svoj redni broj (Rb) iz
 * Potvrde o stanju, da se lakše pronađe na originalnom listu. Isti status
 * (svijetlo zeleno/crveno) se upiše i direktno na sam list Stanje (Potvrda
 * o stanju), na pozadinu cijelog reda svakog grla — bez potrebe da se
 * prebacuje na "Uporedba markica" da bi se vidjelo koje grlo nedostaje.
 * Isto tako, na samom listu Vakcinisano se svijetlo žuto oboji svako grlo
 * čija se markica NE nalazi na listu Stanje (moguća greška u unosu) — lakše
 * ga je uočiti direktno tamo gdje je i upisano. Red(ovi) sa ponovljenom
 * markicom (ista markica upisana dva ili više puta na istom listu) dodatno
 * dobiju debeo zlatan okvir, na oba lista, povrh boje statusa. Iznad
 * detaljne tabele je "Pregled po rasponima (Rb)" — vakcinisani i
 * nevakcinisani brojevi (po Rb sa Potvrde o stanju) grupisani u nizove (npr.
 * "4–57, 78–134") umjesto pojedinačnog čitanja svakog reda, i isti takav
 * pregled još jednom, ali po Rb SAMOG lista Vakcinisano, grupisan po tome
 * je li ta markica na spisku Stanje ili je van spiska (greška).
 *
 * Drugi meni "Izračunaj starost u mjesecima (kolona H)" upiše, na listu
 * Stanje, starost svakog grla u mjesecima (zaokruženo) od datuma rođenja do
 * datuma koji korisnik izabere kad ga skripta pita (prazno = danas).
 *
 * Treći meni "OCR sa slike (besplatno, eksperimentalno)" pita za link/ID
 * fotografije/skena koju prethodno otpremiš na Google Drive (besplatno,
 * preko Drive/Docs OCR konverzije — zahtijeva jednokratno dodavanje
 * napredne "Drive API" usluge u Apps Script editoru), pa upiše best-effort
 * izdvojene redove (Rb/markica/pol/vrsta nagađanje + sirova linija) u
 * poseban list "OCR - pregled", NE direktno u Stanje/Vakcinisano — rezultat
 * treba provjeriti prije ručnog prepisivanja, OCR nije pouzdan za rukopis.
 *
 * Instalacija: Extensions/Proširenja → Apps Script u ovom Google Sheets
 * fajlu, prekopiraj ovaj fajl kao Code.gs (ili dodaj kao novi .gs fajl),
 * sačuvaj, osvježi list — u meniju se pojavi "Markice". Detalji u
 * README.md pored ovog fajla.
 */

var NAZIV_IZLAZNOG_LISTA = 'Uporedba markica';

var SPEC_STANJE = [
  { key: 'markica', kw: ['markic', 'identifikacij'] },
  { key: 'vrsta', kw: ['vrsta'] },
  { key: 'pol', kw: ['pol', 'spol'] },
  { key: 'rb', kw: ['redni broj', 'rbr', 'r.br', 'rb'] },
  { key: 'datumRodjenja', kw: ['rođenja', 'rodjenja'] }
];
var SPEC_VAK_OSNOVNO = [
  { key: 'drzava', kw: ['drzava'] },
  { key: 'markica', kw: ['markic'] },
  { key: 'broj', kw: ['identifikacij'] },
  { key: 'vrsta', kw: ['vrsta'] },
  { key: 'pol', kw: ['pol', 'spol'] },
  { key: 'rb', kw: ['redni broj', 'rbr', 'r.br', 'rb'] }
];
var BOLESTI = [
  { key: 'bruceloza', naziv: 'Bruceloza', kw: ['brucel'] },
  { key: 'leukoza', naziv: 'Enzotska leukoza', kw: ['leukoz'] },
  { key: 'tbc', naziv: 'TBC', kw: ['tbc', 'tuberkuloz'] },
  { key: 'cmt', naziv: 'CMT', kw: ['cmt'] },
  { key: 'antraks', naziv: 'Antrax', kw: ['antraks', 'anthrax'] }
];

// Ista paleta i fontovi kao web aplikacija (CSS custom properties u
// index.html) — da list u Sheetsu vizuelno pripada istom "papir i tinta"
// identitetu, ne izgleda kao gola sirova tabela.
var BOJE = {
  paper: '#f7f3e8', paperRaised: '#fffdf7', paperDim: '#efe7d2',
  ink: '#1f2a1f', inkSoft: '#5b6b52',
  line: '#c9c0a0', lineStrong: '#9c9270',
  zelenaBg: '#dcead9', zelenaFg: '#2e6b3e', zelenaLine: '#a9cba3',
  crvenaBg: '#f5ddd6', crvenaFg: '#b23a2e', crvenaLine: '#e1b6ac',
  zutaBg: '#f7ecd6', zutaFg: '#8a6516', zutaLine: '#e0c68f',
  gold: '#c8912f'
};
var FONT_NASLOV = 'Georgia';
var FONT_TEKST = 'Arial';
var FONT_KOD = 'Courier New';

// ---------- meni ----------

function onOpen() {
  // Apps Script meni ne podržava sliku kao ikonicu — emoji ispred naziva je
  // uobičajen način da meni u traci ipak dobije prepoznatljivu ikonicu.
  SpreadsheetApp.getUi()
    .createMenu('🏷️ Markice')
    .addItem('Uporedi / osvježi "Uporedba markica"', 'uporediMarkice')
    .addItem('Izračunaj starost u mjesecima (kolona H)', 'izracunajStarostUMjesecima')
    .addItem('OCR sa slike (besplatno, eksperimentalno)', 'ocrSaSlike')
    .addToUi();
}

// ---------- glavna funkcija ----------

function uporediMarkice() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var listovi = pronadjiListove_(ss);

    if (!listovi.stanje && !listovi.vak) {
      prikaziPoruku_(
        'Nije prepoznat nijedan spisak',
        'U ovom fajlu nije prepoznat ni spisak grla (Stanje) ni spisak vakcinisanih ' +
        '(Vakcinisano) — ni po nazivu lista, ni po sadržaju zaglavlja. Provjeri da ' +
        'zaglavlje (prvi red) ima kolonu za markicu (npr. "Šifra ušne markice", ' +
        '"Identifikacijski broj") i, za spisak vakcinisanih, bar jednu kolonu bolesti ' +
        '(Bruceloza, Enzotska leukoza, TBC, CMT, Antrax).'
      );
      return;
    }

    var podaci = procitajPodatke_(listovi.podaci);
    var stanje = procitajStanje_(listovi.stanje);
    var vak = procitajVakcinisano_(listovi.vak);
    var rezultat = izracunajUporedbu_(stanje.mapa, vak.mapa);
    var duplikatiStanje = pronadjiDuplikate_(stanje.redovi);
    var duplikatiVak = pronadjiDuplikate_(vak.redovi);

    upisiRezultat_(ss, listovi, podaci, rezultat, stanje.mapa, vak.mapa, stanje.preskoceno, vak.preskoceno, duplikatiStanje.length, duplikatiVak.length);
    oznaciListStanja_(listovi.stanje, stanje.redovi, vak.mapa, duplikatiStanje);
    oznaciListVakcinisanih_(listovi.vak, vak.redovi, stanje.mapa, duplikatiVak);

    var izlazniList = ss.getSheetByName(NAZIV_IZLAZNOG_LISTA);
    ss.setActiveSheet(izlazniList);
    // Rezultat je ono zbog čega se fajl otvara — neka bude prvi jezičak, ne
    // zakopan iza Podaci/Stanje/Vakcinisano.
    try { ss.moveActiveSheet(1); } catch (e) { /* npr. zaštićen raspored listova */ }
    var ukupnoDuplikata = duplikatiStanje.length + duplikatiVak.length;
    prikaziPoruku_(
      'Gotovo',
      'Upisano u list "' + NAZIV_IZLAZNOG_LISTA + '": ' + rezultat.roster.length + ' grla na spisku, ' +
      rezultat.podudara.length + ' vakcinisano (' + rezultat.postotak + '%).' +
      (listovi.stanje ? ' List "' + listovi.stanje.getName() + '" je i sam obojen po istom statusu (zeleno/crveno).' : '') +
      (listovi.vak && rezultat.nijeUSpisku.length ? ' Na listu "' + listovi.vak.getName() + '" su žuto označena ' + rezultat.nijeUSpisku.length + ' grla koja nisu na spisku Stanje (provjeri grešku).' : '') +
      (ukupnoDuplikata ? ' ⚠ ' + ukupnoDuplikata + ' red(ova) sa ponovljenom markicom je obilježeno zlatnim okvirom.' : '')
    );
  } catch (e) {
    prikaziPoruku_('Greška', 'Uporedba nije uspjela: ' + e.message);
    throw e;
  }
}

function prikaziPoruku_(naslov, tekst) {
  try {
    SpreadsheetApp.getUi().alert(naslov, tekst, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    // Bez UI konteksta (npr. pokrenuto iz editora bez otvorenog lista) —
    // poruka ide u log umjesto da skripta samo tiho ne uradi ništa.
    Logger.log(naslov + ': ' + tekst);
  }
}

// ---------- prepoznavanje listova (po nazivu, pa po sadržaju zaglavlja) ----------

function pronadjiListove_(ss) {
  var sheets = ss.getSheets().filter(function (sh) {
    return sh.getName() !== NAZIV_IZLAZNOG_LISTA;
  });

  // Redoslijed traženja po nazivu je bitan: prvo najspecifičnije riječi
  // (vakcin, pa podaci/vlasnik), svaki sljedeći korak isključuje već
  // dodijeljene listove. Stanje se traži zadnje jer koristi i opštu riječ
  // 'grla' (radi generičkih naziva spiska) — bez isključivanja bi ta riječ
  // mogla pogrešno pogoditi i sam list Vakcinisano (npr. naziv "Vakcinisana
  // grla" sadrži i 'vakcin' i 'grla'), i to zavisno od redoslijeda jezičaka.
  var listVak = pronadjiListPoNazivu_(sheets, ['vakcin'], []);
  var listPodaci = pronadjiListPoNazivu_(sheets, ['podaci', 'vlasnik'], [listVak]);
  var listStanje = pronadjiListPoNazivu_(sheets, ['stanj', 'roster', 'grla'], [listVak, listPodaci]);

  if (!listPodaci || !listStanje || !listVak) {
    for (var i = 0; i < sheets.length; i++) {
      var sh = sheets[i];
      if (sh === listPodaci || sh === listStanje || sh === listVak) continue;
      var lastCol = sh.getLastColumn();
      if (lastCol < 1) continue;
      var header = sh.getRange(1, 1, 1, lastCol).getValues()[0];
      var pogodak = pogodiVrstuLista_(header);
      if (pogodak === 'podaci' && !listPodaci) listPodaci = sh;
      else if (pogodak === 'vak' && !listVak) listVak = sh;
      else if (pogodak === 'markica') {
        // Nema kolone bolesti pa se ne može sigurno reći je li ovo Stanje ili
        // Vakcinisano (npr. kad se u oba lista unosi samo markica) — dodijeli
        // slobodnom mjestu, prvo Stanje pa Vakcinisano.
        if (!listStanje) listStanje = sh;
        else if (!listVak) listVak = sh;
      }
    }
  }

  return { podaci: listPodaci, stanje: listStanje, vak: listVak };
}

function pronadjiListPoNazivu_(sheets, kljucneRijeci, iskljuci) {
  for (var i = 0; i < sheets.length; i++) {
    if (iskljuci && iskljuci.indexOf(sheets[i]) !== -1) continue;
    var naziv = ocistiTekst_(sheets[i].getName());
    for (var j = 0; j < kljucneRijeci.length; j++) {
      if (naziv.indexOf(kljucneRijeci[j]) !== -1) return sheets[i];
    }
  }
  return null;
}

function izgledaKaoPodaci_(headerRow) {
  return ocistiTekst_(headerRow[0]).indexOf('parametar') !== -1 &&
    ocistiTekst_(headerRow[1]).indexOf('vrijednost') !== -1;
}

// Pogađa ulogu lista po SADRŽAJU zaglavlja — koristi se kad naziv lista ne
// pomogne (npr. fajl izvezen iz Google Sheets kao generičko "Table 1/2/3").
// Vraća 'podaci', 'vak' (markica + bar jedna kolona bolesti), 'markica'
// (ima markicu ali NIJEDNU kolonu bolesti — dvosmisleno, može biti i Stanje
// i Vakcinisano ako fajl uopšte nema kolonu bolesti, npr. kad se u oba lista
// unosi samo markica) ili null (nema ni markicu).
function pogodiVrstuLista_(headerRow) {
  if (izgledaKaoPodaci_(headerRow)) return 'podaci';
  var osnovno = pronadjiKolone_(headerRow, SPEC_VAK_OSNOVNO);
  var bolesti = pronadjiKolone_(headerRow, BOLESTI);
  var imaMarkicu = osnovno.markica !== undefined || osnovno.broj !== undefined;
  if (!imaMarkicu) return null;
  return Object.keys(bolesti).length ? 'vak' : 'markica';
}

// ---------- prepoznavanje kolona (po nazivu u zaglavlju, ne po poziciji) ----------

function pronadjiKolone_(headerRow, spec) {
  var rezultat = {};
  for (var i = 0; i < headerRow.length; i++) {
    var cist = ocistiTekst_(headerRow[i]);
    if (!cist) continue;
    for (var j = 0; j < spec.length; j++) {
      var s = spec[j];
      if (rezultat[s.key] !== undefined) continue;
      for (var k = 0; k < s.kw.length; k++) {
        if (cist.indexOf(s.kw[k]) !== -1) { rezultat[s.key] = i; break; }
      }
    }
  }
  return rezultat;
}

// ---------- tekst/markica normalizacija ----------

function ocistiTekst_(s) {
  return (s === null || s === undefined ? '' : String(s))
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim();
}

// Uzima cijeli sadržaj ćelije kao markicu, u BILO KOM obliku — ne očekuje se
// "BA" + brojevi kao u web aplikaciji, može biti i čist broj ili bilo šta
// drugo što je upisano u koloni. Velika slova i uklonjeni razmaci/tabovi
// unutar oznake (npr. "BA 4201 184333" i "BA4201184333", ili "4201 184333" i
// "4201184333", prepoznaju se kao ista markica). Prazna ćelija (ili samo
// razmaci) vraća praznu listu.
function izvuciMarkice_(raw) {
  var tekst = (raw === null || raw === undefined ? '' : String(raw)).toUpperCase().replace(/[ \t]+/g, '').trim();
  return tekst ? [tekst] : [];
}

function normalizujPol_(sirovo) {
  var s = ocistiTekst_(sirovo);
  if (s === 'm' || s.indexOf('musk') === 0) return 'M';
  if (s === 'z' || s.indexOf('zensk') === 0) return 'Ž';
  return '';
}

function redImaSadrzaj_(red) {
  for (var i = 0; i < red.length; i++) {
    if (red[i] !== '' && red[i] !== null && red[i] !== undefined) return true;
  }
  return false;
}

// Vraća SVE redove iz `redovi` ({redSaLista, markica}) čija se markica
// pojavljuje više od jednom na istom listu — dvostruk unos je čest izvor
// grešaka (kopiranje reda, ista markica upisana dva puta za dva grla) i
// inače prolazi neopaženo jer se druga pojava samo tiho preskoči u mapi.
function pronadjiDuplikate_(redovi) {
  var brojanje = {};
  redovi.forEach(function (r) { brojanje[r.markica] = (brojanje[r.markica] || 0) + 1; });
  return redovi.filter(function (r) { return brojanje[r.markica] > 1; });
}

// Koristi se samo za list Vakcinisano (npr. "Vakcinisana Grla") — markica se
// čita po prepoznatom nazivu kolone, ili država+broj u dvije kolone. Ako
// ništa nije prepoznato po zaglavlju (fajl bez opisnih naziva), kao zadnji
// pokušaj se spoje kolone B i C direktno po poziciji — stvarni fajlovi
// veterinarskih stanica znaju imati markicu razdvojenu ovako, bez ikakvog
// prepoznatljivog zaglavlja, npr. "BA" + "42329525" -> "BA42329525".
function procitajSirovuMarkicu_(kolone, red) {
  if (kolone.markica !== undefined) return red[kolone.markica];
  if (kolone.drzava !== undefined || kolone.broj !== undefined) {
    var drzava = kolone.drzava !== undefined ? red[kolone.drzava] : '';
    var broj = kolone.broj !== undefined ? red[kolone.broj] : '';
    return String(drzava || '') + String(broj || '');
  }
  return String(red[1] || '') + String(red[2] || '');
}

// Redni broj iz kolone "Rb"/"Redni broj" u listu Stanje, ako postoji — da se
// grlo lakše pronađe na originalnoj Potvrdi o stanju (ti brojevi znaju biti
// preneseni s fizičkog obrasca, npr. nastavljati se 381, 382... a ne kretati
// od 1). Ako kolona ne postoji ili je baš ta ćelija prazna, koristi se
// prirodna pozicija reda u listu (1, 2, 3...) kao razuman zamjenski broj.
function ocitajRedniBroj_(kolone, red, pozicija) {
  if (kolone.rb !== undefined) {
    var vrijednost = red[kolone.rb];
    if (vrijednost !== '' && vrijednost !== null && vrijednost !== undefined) return String(vrijednost).trim();
  }
  return String(pozicija);
}

// ---------- čitanje listova ----------

// "Podaci" je parametar/vrijednost tabela (kolona A = naziv polja, B =
// vrijednost), ne obična tabela s jednim zaglavljem.
function procitajPodatke_(sheet) {
  var out = { vlasnik: '', sifraImanja: '', adresaMjesto: '' };
  if (!sheet) return out;
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return out;
  var vrijednosti = sheet.getRange(1, 1, lastRow, 2).getValues();
  for (var i = 0; i < vrijednosti.length; i++) {
    var kljuc = ocistiTekst_(vrijednosti[i][0]);
    var vrijednost = vrijednosti[i][1] === null ? '' : String(vrijednosti[i][1]).trim();
    if (!kljuc) continue;
    if (!out.vlasnik && (kljuc.indexOf('vlasnik') !== -1 || kljuc.indexOf('drzalac') !== -1)) out.vlasnik = vrijednost;
    if (!out.sifraImanja && kljuc.indexOf('sifra imanja') !== -1) out.sifraImanja = vrijednost;
    if (!out.adresaMjesto && kljuc.indexOf('adresa') !== -1 && kljuc.indexOf('mjesto') !== -1) out.adresaMjesto = vrijednost;
  }
  return out;
}

// Vraća {mapa: {markica: {pol, vrsta}}, preskoceno: broj redova sa
// sadržajem čija se markica nije prepoznala — mogla je biti štamparska
// greška u fajlu, isto kao "preskočeno" poruka kod uvoza u web aplikaciji.
function procitajStanje_(sheet) {
  var mapa = {};
  var preskoceno = 0;
  // Svaki uspješno pročitan red (i ponovljeni upisi iste markice) — koristi
  // se za bojenje samog lista Stanje po stvarnom redu na listu, ne samo
  // deduplicirane podatke iz mape.
  var redovi = [];
  if (!sheet) return { mapa: mapa, preskoceno: preskoceno, redovi: redovi };
  var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return { mapa: mapa, preskoceno: preskoceno, redovi: redovi };
  var podaci = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var kolone = pronadjiKolone_(podaci[0], SPEC_STANJE);
  for (var i = 1; i < podaci.length; i++) {
    var red = podaci[i];
    var sirovaMarkica = kolone.markica !== undefined ? red[kolone.markica] : '';
    var markice = izvuciMarkice_(sirovaMarkica);
    if (!markice.length) { if (redImaSadrzaj_(red)) preskoceno++; continue; }
    var markica = markice[0];
    redovi.push({ redSaLista: i + 1, markica: markica });
    if (!mapa[markica]) {
      mapa[markica] = {
        pol: kolone.pol !== undefined ? normalizujPol_(red[kolone.pol]) : '',
        vrsta: kolone.vrsta !== undefined ? String(red[kolone.vrsta] || '').trim() : '',
        redniBroj: ocitajRedniBroj_(kolone, red, i)
      };
    }
  }
  return { mapa: mapa, preskoceno: preskoceno, redovi: redovi };
}

// Vraća {mapa: {markica: {pol, vrsta, bolesti:{...}, redniBroj}}, preskoceno,
// redovi}. Markica zapisana u dvije kolone (Država + broj, npr. "BA" +
// "4200571206") se spaja prije prepoznavanja, kao i u web aplikaciji. `redovi`
// je spisak SVIH uspješno pročitanih redova ({redSaLista, markica}), koji
// koristi oznaciListVakcinisanih_ da oboji list po redovima (ne samo po
// jedinstvenoj markici u mapi). `redniBroj` je isto kao kod Stanje — iz
// kolone "Rb"/"Redni broj" ako postoji, inače prirodna pozicija reda.
function procitajVakcinisano_(sheet) {
  var mapa = {};
  var preskoceno = 0;
  var redovi = [];
  if (!sheet) return { mapa: mapa, preskoceno: preskoceno, redovi: redovi };
  var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return { mapa: mapa, preskoceno: preskoceno, redovi: redovi };
  var podaci = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var header = podaci[0];
  var kolone = pronadjiKolone_(header, SPEC_VAK_OSNOVNO);
  var boljeKolone = pronadjiKolone_(header, BOLESTI);
  for (var i = 1; i < podaci.length; i++) {
    var red = podaci[i];
    var sirovaMarkica = procitajSirovuMarkicu_(kolone, red);
    var markice = izvuciMarkice_(sirovaMarkica);
    if (!markice.length) { if (redImaSadrzaj_(red)) preskoceno++; continue; }
    var markica = markice[0];
    redovi.push({ redSaLista: i + 1, markica: markica });
    if (!mapa[markica]) {
      var bolesti = {};
      for (var b = 0; b < BOLESTI.length; b++) {
        var key = BOLESTI[b].key;
        bolesti[key] = boljeKolone[key] !== undefined ? String(red[boljeKolone[key]] || '').trim() : '';
      }
      mapa[markica] = {
        pol: kolone.pol !== undefined ? normalizujPol_(red[kolone.pol]) : '',
        vrsta: kolone.vrsta !== undefined ? String(red[kolone.vrsta] || '').trim() : '',
        bolesti: bolesti,
        redniBroj: ocitajRedniBroj_(kolone, red, i)
      };
    }
  }
  return { mapa: mapa, preskoceno: preskoceno, redovi: redovi };
}

// ---------- poređenje ----------

// Redni broj je tekst (može doći iz proizvoljne ćelije), ali je skoro uvijek
// zapravo broj — poredi se brojčano kad oba jesu brojevi (381 prije 45), a
// tekstualno tek kad neki od njih to nije (npr. ručno dopisano "12a").
function uporediRedneBrojeve_(a, b) {
  var na = parseFloat(a), nb = parseFloat(b);
  if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
  return String(a).localeCompare(String(b), 'bs');
}

function jeCistBroj_(s) {
  return /^\d+$/.test(String(s === undefined || s === null ? '' : s).trim());
}

// Grupiše stavke (već sortirane po redniBroj) u nizove UZASTOPNIH brojeva sa
// istim statusom vakcinacije — npr. umjesto 50 pojedinačnih redova, prikaz
// "4–57, 78–134" odmah pokaže gdje su rupe (preskočeni/nepostojeći brojevi)
// i gdje se status mijenja. Redni broj koji nije čist cijeli broj (rijetko,
// npr. ručno dopisano "12a") ostaje svoj vlastiti raspon od jedne stavke.
function grupisiURangeve_(stavke) {
  var rasponi = [];
  var trenutni = null;
  stavke.forEach(function (s) {
    var brojacki = jeCistBroj_(s.redniBroj);
    var broj = brojacki ? parseInt(s.redniBroj, 10) : null;
    if (trenutni && trenutni.vakcinisano === s.vakcinisano && trenutni.brojacki && brojacki && broj === trenutni.krajBroj + 1) {
      trenutni.kraj = s.redniBroj;
      trenutni.krajBroj = broj;
    } else {
      trenutni = { pocetak: s.redniBroj, kraj: s.redniBroj, krajBroj: broj, brojacki: brojacki, vakcinisano: s.vakcinisano };
      rasponi.push(trenutni);
    }
  });
  return rasponi;
}

function formatirajRaspone_(rasponi) {
  return rasponi.map(function (r) {
    return r.pocetak === r.kraj ? String(r.pocetak) : r.pocetak + '–' + r.kraj;
  }).join(', ');
}

function izracunajUporedbu_(stanjeMapa, vakMapa) {
  // Spisak grla ide u istom redoslijedu kao na originalnoj Potvrdi o stanju
  // (po Rb), ne abecedno po markici — upravo zato Rb i postoji, da se lista
  // može pratiti odozgo nadolje uporedo sa papirnim/originalnim listom.
  var roster = Object.keys(stanjeMapa).sort(function (a, b) {
    return uporediRedneBrojeve_(stanjeMapa[a].redniBroj, stanjeMapa[b].redniBroj);
  });
  var vakKljucevi = Object.keys(vakMapa);
  var vakSet = {};
  for (var i = 0; i < vakKljucevi.length; i++) vakSet[vakKljucevi[i]] = true;

  var podudara = roster.filter(function (m) { return vakSet[m]; });
  var nijeVakcinisano = roster.filter(function (m) { return !vakSet[m]; });
  var nijeUSpisku = vakKljucevi.filter(function (m) { return !stanjeMapa[m]; }).sort();
  var postotak = roster.length ? Math.round(podudara.length / roster.length * 100) : 0;

  return {
    roster: roster,
    podudara: podudara,
    nijeVakcinisano: nijeVakcinisano,
    nijeUSpisku: nijeUSpisku,
    postotak: postotak
  };
}

// Oboji direktno sam list Stanje (Potvrda o stanju) — svijetlo zeleno grla
// koja jesu vakcinisana, svijetlo crveno ona koja nisu — da se vidi na prvi
// pogled i na originalnom listu, ne samo u listu "Uporedba markica". Boji se
// samo pozadina (ne i tekst), da se ne dira ništa drugo na tuđem listu. Red(ovi)
// sa ponovljenom markicom (isti duplikat na dva mjesta na listu) dodatno
// dobiju debeo zlatan okvir, povrh boje statusa — brz signal da nešto treba
// provjeriti. Prvo se poništi prethodno bojenje/okviri cijelog opsega
// podataka, pa se boji iznova (svaki put osvježi, isto kao i "Uporedba
// markica" list).
function oznaciListStanja_(sheet, redovi, vakMapa, duplikati) {
  if (!sheet) return;
  var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return;
  var cijeliOpseg = sheet.getRange(2, 1, lastRow - 1, lastCol);
  cijeliOpseg.setBackground(null);
  cijeliOpseg.setBorder(false, false, false, false, false, false);
  redovi.forEach(function (r) {
    var boja = vakMapa[r.markica] ? BOJE.zelenaBg : BOJE.crvenaBg;
    sheet.getRange(r.redSaLista, 1, 1, lastCol).setBackground(boja);
  });
  oznaciDuplikate_(sheet, lastCol, duplikati);
}

// Zaokruži red(ove) sa ponovljenom markicom debelim zlatnim okvirom, POVRH
// postojeće pozadinske boje (status vakcinacije se i dalje vidi) — brz
// vizuelni signal "provjeri ovo" bez oduzimanja postojeće boje.
function oznaciDuplikate_(sheet, lastCol, duplikati) {
  (duplikati || []).forEach(function (r) {
    sheet.getRange(r.redSaLista, 1, 1, lastCol)
      .setBorder(true, true, true, true, false, false, BOJE.gold, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  });
}

// Oboji direktno sam list Vakcinisano — svijetlo žuto (ista boja kao status
// "vakcinisano, van spiska" u "Uporedba markica") samo za grla koja SU
// vakcinisana ali se njihova markica NE nalazi na listu Stanje — moguća
// greška u unosu (višak, pogrešno prepisana markica, grlo koje stvarno
// nedostaje sa spiska). Grla čija markica JESTE na Stanju nisu greška, pa
// ostaju bez boje — samo se ističe ono što treba provjeriti. Boji se samo
// pozadina, i iznova pri svakom pokretanju (staro bojenje se prvo poništi).
function oznaciListVakcinisanih_(sheet, redovi, stanjeMapa, duplikati) {
  if (!sheet) return;
  var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return;
  var cijeliOpseg = sheet.getRange(2, 1, lastRow - 1, lastCol);
  cijeliOpseg.setBackground(null);
  cijeliOpseg.setBorder(false, false, false, false, false, false);
  redovi.forEach(function (r) {
    if (!stanjeMapa[r.markica]) {
      sheet.getRange(r.redSaLista, 1, 1, lastCol).setBackground(BOJE.zutaBg);
    }
  });
  oznaciDuplikate_(sheet, lastCol, duplikati);
}

// ---------- ispis rezultata ----------

function upisiRezultat_(ss, listovi, podaci, rezultat, stanjeMapa, vakMapa, preskocenoStanje, preskocenoVak, duplikatiStanje, duplikatiVak) {
  var sheet = ss.getSheetByName(NAZIV_IZLAZNOG_LISTA);
  if (sheet) {
    sheet.clear();
    sheet.clearFormats();
    var postojeciFilter = sheet.getFilter();
    if (postojeciFilter) postojeciFilter.remove();
    // Skroluj standardno, bez zamrznutih redova/kolona — clear()/clearFormats()
    // ne dira zamrznuto stanje, pa se ono mora eksplicitno ukinuti i za listove
    // koje je neka ranija verzija skripte već zamrznula.
    sheet.setFrozenRows(0);
    sheet.setFrozenColumns(0);
  } else {
    sheet = ss.insertSheet(NAZIV_IZLAZNOG_LISTA);
  }

  var brojKolona = 5 + BOLESTI.length; // Markica, Rb, Status, Pol, Vrsta + 5 bolesti

  // Gola tabela sa zadanim Sheets linijama izgleda kao sirovi izvještaj —
  // sakrivena mreža + vlastite ivice/pozadine daju izgled "papir i tinta"
  // dizajna aplikacije umjesto gole tabele.
  sheet.setHiddenGridlines(true);
  try { sheet.setTabColor(BOJE.gold); } catch (e) { /* starije Sheets API verzije bez tab boje */ }

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 70);
  sheet.setColumnWidth(3, 210);
  sheet.setColumnWidth(4, 55);
  sheet.setColumnWidth(5, 115);
  for (var c = 6; c <= brojKolona; c++) sheet.setColumnWidth(c, 120);

  // ---- banner naslova (puna širina, ink pozadina) ----
  var naslov = 'Uporedba markica' + (podaci.vlasnik ? ' — ' + podaci.vlasnik : '');
  sheet.getRange(1, 1, 1, brojKolona).merge()
    .setValue(naslov).setBackground(BOJE.ink).setFontColor(BOJE.paper)
    .setFontFamily(FONT_NASLOV).setFontSize(18).setFontWeight('bold')
    .setVerticalAlignment('middle').setHorizontalAlignment('left');
  sheet.setRowHeight(1, 40);

  var podnaslovDijelovi = [];
  if (podaci.sifraImanja) podnaslovDijelovi.push('Šifra imanja: ' + podaci.sifraImanja);
  if (podaci.adresaMjesto) podnaslovDijelovi.push(podaci.adresaMjesto);
  podnaslovDijelovi.push('Generisano: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Sarajevo', 'dd.MM.yyyy. HH:mm'));
  sheet.getRange(2, 1, 1, brojKolona).merge()
    .setValue(podnaslovDijelovi.join('   ·   ')).setBackground(BOJE.paperDim).setFontColor(BOJE.inkSoft)
    .setFontFamily(FONT_TEKST).setFontSize(10).setVerticalAlignment('middle');
  sheet.setRowHeight(2, 22);

  // tanka zlatna traka — isti akcent kao ispod topbar-a u aplikaciji
  sheet.getRange(3, 1, 1, brojKolona).merge().setBackground(BOJE.gold);
  sheet.setRowHeight(3, 4);

  // ---- rekap sa statistikom (4 kartice, po 2 kolone) ----
  // Vakcinisano kartica dobije i mali tekstualni bar (blok karakteri) ispod
  // postotka — brz vizuelni osjećaj napretka bez potrebe za grafikonom.
  var popunjenoBlokova = rezultat.roster.length ? Math.round(rezultat.postotak / 10) : 0;
  var bar = '█'.repeat(popunjenoBlokova) + '░'.repeat(10 - popunjenoBlokova);
  var kartice = [
    { naziv: 'Grla na spisku', vrijednost: String(rezultat.roster.length), bg: BOJE.paperRaised, fg: BOJE.ink, linija: BOJE.lineStrong },
    { naziv: 'Vakcinisano', vrijednost: rezultat.podudara.length + (rezultat.roster.length ? ' (' + rezultat.postotak + '%)\n' + bar : ''), bg: BOJE.zelenaBg, fg: BOJE.zelenaFg, linija: BOJE.zelenaLine },
    { naziv: 'Nije vakcinisano', vrijednost: String(rezultat.nijeVakcinisano.length), bg: BOJE.crvenaBg, fg: BOJE.crvenaFg, linija: BOJE.crvenaLine },
    { naziv: 'Vakcinisano, van spiska', vrijednost: String(rezultat.nijeUSpisku.length), bg: BOJE.zutaBg, fg: BOJE.zutaFg, linija: BOJE.zutaLine }
  ];
  var redLabela = 5, redVrijednosti = 6;
  sheet.setRowHeight(redLabela, 22);
  sheet.setRowHeight(redVrijednosti, 50);
  // Kartice dijele ukupnu širinu tabele u 4 (skoro) jednaka dijela — zadnja
  // pokupi ostatak, tako da se raspoređuju lijepo bez obzira koliko kolona
  // tabela ukupno ima (npr. kad se doda još jedna kolona kao Rb).
  var osnovniRaspon = Math.floor(brojKolona / kartice.length);
  var kolStart = 1;
  kartice.forEach(function (k, idx) {
    var raspon = idx === kartice.length - 1 ? (brojKolona - kolStart + 1) : osnovniRaspon;
    var labelOpseg = sheet.getRange(redLabela, kolStart, 1, raspon).merge();
    labelOpseg.setValue(k.naziv).setBackground(k.bg).setFontColor(k.fg)
      .setFontFamily(FONT_TEKST).setFontSize(9).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    var vrijednostOpseg = sheet.getRange(redVrijednosti, kolStart, 1, raspon).merge();
    vrijednostOpseg.setValue(k.vrijednost).setBackground(k.bg).setFontColor(k.fg)
      .setFontFamily(FONT_NASLOV).setFontSize(17).setFontWeight('bold').setWrap(true)
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    sheet.getRange(redLabela, kolStart, 2, raspon)
      .setBorder(true, true, true, true, false, false, k.linija, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    kolStart += raspon;
  });

  var sljedeciRed = redVrijednosti + 1;
  sheet.getRange(sljedeciRed, 1, 1, brojKolona).merge()
    .setValue('🟢 vakcinisano   🔴 nije vakcinisano   🟡 vakcinisano, ali nije na spisku grla (moguća greška u unosu)')
    .setFontFamily(FONT_TEKST).setFontSize(9).setFontStyle('italic').setFontColor(BOJE.inkSoft)
    .setVerticalAlignment('middle');
  sheet.setRowHeight(sljedeciRed, 20);
  sljedeciRed += 1;

  var ukupnoPreskoceno = preskocenoStanje + preskocenoVak;
  if (ukupnoPreskoceno > 0) {
    var poruka = '⚠ ' + ukupnoPreskoceno + ' red(ova) preskočeno — kolona sa markicom je prazna ' +
      'u tom redu, provjeri original.';
    sheet.getRange(sljedeciRed, 1, 1, brojKolona).merge()
      .setValue(poruka).setFontFamily(FONT_TEKST).setFontColor(BOJE.crvenaFg)
      .setFontStyle('italic').setFontSize(10).setVerticalAlignment('middle');
    sljedeciRed += 1;
  }

  var ukupnoDuplikata = (duplikatiStanje || 0) + (duplikatiVak || 0);
  if (ukupnoDuplikata > 0) {
    var porukaDuplikata = '⚠ ' + ukupnoDuplikata + ' red(ova) ima ponovljenu markicu (ista markica upisana ' +
      'dva ili više puta na istom listu) — obilježeno zlatnim okvirom direktno na listu Stanje/Vakcinisano.';
    sheet.getRange(sljedeciRed, 1, 1, brojKolona).merge()
      .setValue(porukaDuplikata).setFontFamily(FONT_TEKST).setFontColor(BOJE.gold)
      .setFontStyle('italic').setFontSize(10).setVerticalAlignment('middle');
    sljedeciRed += 1;
  }

  sljedeciRed += 1;

  // ---- pregled po rasponima (Rb) — "4–57, 78–134" umjesto čitanja svakog
  // reda pojedinačno, korisno za brzo poređenje sa fizičkim/originalnim
  // listom (koji broj do kojeg je urađen, gdje je rupa/promjena). ----
  if (rezultat.roster.length) {
    var stavkeZaRaspone = rezultat.roster.map(function (m) {
      return { redniBroj: stanjeMapa[m].redniBroj, vakcinisano: !!vakMapa[m] };
    });
    var sviRasponi = grupisiURangeve_(stavkeZaRaspone);
    var vakciniraniRasponi = formatirajRaspone_(sviRasponi.filter(function (r) { return r.vakcinisano; })) || '— nema —';
    var nevakciniraniRasponi = formatirajRaspone_(sviRasponi.filter(function (r) { return !r.vakcinisano; })) || '— nema —';

    sheet.getRange(sljedeciRed, 1, 1, brojKolona).merge()
      .setValue('Pregled po rasponima (Rb)').setFontFamily(FONT_NASLOV).setFontColor(BOJE.ink)
      .setFontWeight('bold').setFontSize(12);
    sheet.setRowHeight(sljedeciRed, 24);
    sljedeciRed += 1;

    var raspRedovi = [
      { oznaka: '🟢 Vakcinisano', tekst: vakciniraniRasponi, bg: BOJE.zelenaBg, fg: BOJE.zelenaFg },
      { oznaka: '🔴 Nije vakcinisano', tekst: nevakciniraniRasponi, bg: BOJE.crvenaBg, fg: BOJE.crvenaFg }
    ];
    var prviRaspRed = sljedeciRed;
    raspRedovi.forEach(function (rr) {
      sheet.getRange(sljedeciRed, 1).setValue(rr.oznaka)
        .setFontFamily(FONT_TEKST).setFontWeight('bold').setFontColor(rr.fg).setVerticalAlignment('middle');
      sheet.getRange(sljedeciRed, 2, 1, brojKolona - 1).merge()
        .setValue(rr.tekst).setFontFamily(FONT_TEKST).setFontColor(BOJE.ink).setWrap(true).setVerticalAlignment('middle');
      sheet.getRange(sljedeciRed, 1, 1, brojKolona).setBackground(rr.bg);
      sheet.setRowHeight(sljedeciRed, 32);
      sljedeciRed += 1;
    });
    sheet.getRange(prviRaspRed, 1, 2, brojKolona)
      .setBorder(true, true, true, true, false, true, BOJE.lineStrong, SpreadsheetApp.BorderStyle.SOLID);

    sljedeciRed += 1;
  }

  // ---- isti pregled po rasponima, ali za sam list Vakcinisano — po
  // NJEGOVOM vlastitom Rb (ili prirodnoj poziciji reda ako nema tu kolonu),
  // grupisano po tome je li ta markica i na spisku Stanje (u redu) ili nije
  // (van spiska, moguća greška u unosu). ----
  var vakKljucevi = Object.keys(vakMapa);
  if (vakKljucevi.length) {
    var vakSortirano = vakKljucevi.slice().sort(function (a, b) {
      return uporediRedneBrojeve_(vakMapa[a].redniBroj, vakMapa[b].redniBroj);
    });
    var stavkeZaRasponeVak = vakSortirano.map(function (m) {
      return { redniBroj: vakMapa[m].redniBroj, vakcinisano: !!stanjeMapa[m] };
    });
    var sviRasponiVak = grupisiURangeve_(stavkeZaRasponeVak);
    var naSpiskuRasponi = formatirajRaspone_(sviRasponiVak.filter(function (r) { return r.vakcinisano; })) || '— nema —';
    var vanSpiskaRasponi = formatirajRaspone_(sviRasponiVak.filter(function (r) { return !r.vakcinisano; })) || '— nema —';

    sheet.getRange(sljedeciRed, 1, 1, brojKolona).merge()
      .setValue('Pregled po rasponima (Rb) — Vakcinisano').setFontFamily(FONT_NASLOV).setFontColor(BOJE.ink)
      .setFontWeight('bold').setFontSize(12);
    sheet.setRowHeight(sljedeciRed, 24);
    sljedeciRed += 1;

    var raspRedoviVak = [
      { oznaka: '🟢 Na spisku Stanje', tekst: naSpiskuRasponi, bg: BOJE.zelenaBg, fg: BOJE.zelenaFg },
      { oznaka: '🟡 Van spiska (greška)', tekst: vanSpiskaRasponi, bg: BOJE.zutaBg, fg: BOJE.zutaFg }
    ];
    var prviRaspRedVak = sljedeciRed;
    raspRedoviVak.forEach(function (rr) {
      sheet.getRange(sljedeciRed, 1).setValue(rr.oznaka)
        .setFontFamily(FONT_TEKST).setFontWeight('bold').setFontColor(rr.fg).setVerticalAlignment('middle');
      sheet.getRange(sljedeciRed, 2, 1, brojKolona - 1).merge()
        .setValue(rr.tekst).setFontFamily(FONT_TEKST).setFontColor(BOJE.ink).setWrap(true).setVerticalAlignment('middle');
      sheet.getRange(sljedeciRed, 1, 1, brojKolona).setBackground(rr.bg);
      sheet.setRowHeight(sljedeciRed, 32);
      sljedeciRed += 1;
    });
    sheet.getRange(prviRaspRedVak, 1, 2, brojKolona)
      .setBorder(true, true, true, true, false, true, BOJE.lineStrong, SpreadsheetApp.BorderStyle.SOLID);

    sljedeciRed += 1;
  }

  var zaglavljeTabele = ['Markica', 'Rb (Potvrda o stanju)', 'Status', 'Pol', 'Vrsta'].concat(BOLESTI.map(function (b) { return b.naziv; }));

  if (!rezultat.roster.length && !rezultat.nijeUSpisku.length) {
    sheet.getRange(sljedeciRed, 1).setValue('Nema podataka za prikaz — provjeri da listovi Stanje/Vakcinisano imaju popunjene redove.')
      .setFontFamily(FONT_TEKST).setFontStyle('italic').setFontColor(BOJE.inkSoft);
    return;
  }

  var glavnaTabela = upisiTabeluMarkica_(
    sheet, sljedeciRed, 'Spisak grla (' + rezultat.roster.length + ')',
    zaglavljeTabele, rezultat.roster, stanjeMapa, vakMapa, true
  );
  sljedeciRed = glavnaTabela.sljedeciRed;

  if (rezultat.nijeUSpisku.length) {
    sljedeciRed += 1;
    upisiTabeluMarkica_(
      sheet, sljedeciRed,
      'Vakcinisano, van spiska grla (' + rezultat.nijeUSpisku.length + ') — nije na spisku grla, moguća greška u unosu',
      zaglavljeTabele, rezultat.nijeUSpisku, stanjeMapa, vakMapa, false
    );
  }
}

// Ispisuje naslov sekcije + tabelu markica počevši od zadanog reda, vraća
// prvi slobodan red poslije tabele. `jeRoster` bira da li se markice boje
// prema tome jesu li vakcinisane (spisak grla) ili se sve boje žuto
// (spisak "van spiska", gdje je sama pojava na listi već anomalija).
function upisiTabeluMarkica_(sheet, red, naslovSekcije, zaglavlje, markiceLista, stanjeMapa, vakMapa, jeRoster) {
  var brojKolona = zaglavlje.length;

  sheet.getRange(red, 1, 1, brojKolona).merge()
    .setValue(naslovSekcije).setFontFamily(FONT_NASLOV).setFontColor(BOJE.ink)
    .setFontWeight('bold').setFontSize(12);
  sheet.setRowHeight(red, 24);
  red += 1;

  sheet.getRange(red, 1, 1, brojKolona).setValues([zaglavlje])
    .setFontFamily(FONT_TEKST).setFontWeight('bold').setFontColor(BOJE.paper).setBackground(BOJE.ink)
    .setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('center');
  sheet.getRange(red, 1).setHorizontalAlignment('left');
  var zaglavljeRed = red;
  sheet.setRowHeight(zaglavljeRed, 32);
  red += 1;

  var redovi = markiceLista.map(function (markica) {
    var vakInfo = vakMapa[markica];
    var stanjeInfo = stanjeMapa[markica];
    var vakcinisano = !!vakInfo;
    var status = !jeRoster ? '🟡 Vakcinisano, van spiska' : (vakcinisano ? '🟢 Vakcinisano' : '🔴 Nije vakcinisano');
    var izvor = stanjeInfo || vakInfo || {};
    var bolestiVrijednosti = BOLESTI.map(function (b) {
      return vakInfo && vakInfo.bolesti ? (vakInfo.bolesti[b.key] || '') : '';
    });
    return {
      // Rb dolazi isključivo iz Potvrde o stanju (stanjeInfo) — grlo koje je
      // samo "vakcinisano, van spiska" tamo se uopšte ne nalazi, pa ćelija
      // ostaje prazna (i to je korisna informacija, ne greška).
      red: [markica, stanjeInfo ? stanjeInfo.redniBroj : '', status, izvor.pol || '', izvor.vrsta || ''].concat(bolestiVrijednosti),
      vakcinisano: vakcinisano
    };
  });

  if (redovi.length) {
    sheet.getRange(red, 1, redovi.length, brojKolona)
      .setValues(redovi.map(function (r) { return r.red; }))
      .setFontFamily(FONT_TEKST).setVerticalAlignment('middle');

    for (var i = 0; i < redovi.length; i++) {
      var boje = !jeRoster ? { bg: BOJE.zutaBg, fg: BOJE.zutaFg } :
        (redovi[i].vakcinisano ? { bg: BOJE.zelenaBg, fg: BOJE.zelenaFg } : { bg: BOJE.crvenaBg, fg: BOJE.crvenaFg });
      var cijeliRed = sheet.getRange(red + i, 1, 1, brojKolona);
      cijeliRed.setBackground(BOJE.paperRaised);
      sheet.getRange(red + i, 1).setFontFamily(FONT_KOD).setFontWeight('bold').setFontColor(BOJE.ink);
      sheet.getRange(red + i, 2).setFontColor(BOJE.inkSoft).setHorizontalAlignment('center');
      sheet.getRange(red + i, 3).setBackground(boje.bg).setFontColor(boje.fg).setFontWeight('bold');
      sheet.setRowHeight(red + i, 21);
    }
  } else {
    sheet.getRange(red, 1).setValue('— nema —').setFontFamily(FONT_TEKST).setFontStyle('italic').setFontColor(BOJE.inkSoft);
  }

  var brojRedova = Math.max(redovi.length, 1);
  var cijelaTabela = sheet.getRange(zaglavljeRed, 1, brojRedova + 1, brojKolona);
  cijelaTabela.setBorder(true, true, true, true, false, false, BOJE.lineStrong, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sheet.getRange(zaglavljeRed + 1, 1, brojRedova, brojKolona)
    .setBorder(false, false, false, false, false, true, BOJE.line, SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(zaglavljeRed, 3, brojRedova + 1, 1)
    .setBorder(false, true, false, true, false, false, BOJE.lineStrong, SpreadsheetApp.BorderStyle.SOLID);
  // Razdjelnik prije prve kolone bolesti — vizuelno odvaja "ko je grlo" (Markica..Vrsta) od "šta je urađeno" (bolesti/mjere).
  var prvaBolestKolona = brojKolona - BOLESTI.length + 1;
  if (prvaBolestKolona > 1 && prvaBolestKolona <= brojKolona) {
    sheet.getRange(zaglavljeRed, prvaBolestKolona, brojRedova + 1, 1)
      .setBorder(false, true, false, false, false, false, BOJE.lineStrong, SpreadsheetApp.BorderStyle.SOLID);
  }

  return { sljedeciRed: zaglavljeRed + brojRedova + 1, zaglavljeRed: zaglavljeRed };
}

// ---------- starost u mjesecima (na izabrani datum) ----------

// Prosječan broj dana u mjesecu (365.2425 / 12) — koristi se za zaokruživanje
// starosti u mjesecima na cijeli broj.
var PROSJECNIH_DANA_U_MJESECU = 30.4368;

// Traži i upisuje na listu Stanje (Potvrda o stanju), u kolonu H, starost u
// mjesecima za svako grlo — izračunatu od datuma rođenja (kolona sa nazivom
// koji sadrži "rođenja") do datuma koji korisnik unese kad ga skripta pita
// (prazno = danas). Starost je zaokružena na najbliži cijeli mjesec. List se
// svaki put ponovo prepiše (staro se poništi), pa je sigurno pokretati opet
// sa drugim datumom.
function izracunajStarostUMjesecima() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  try {
    var listovi = pronadjiListove_(ss);
    var sheet = listovi.stanje;
    if (!sheet) {
      prikaziPoruku_('Nije prepoznat list Stanje', 'Nije prepoznat list sa spiskom grla (Stanje/Potvrda o stanju) — provjeri naziv ili zaglavlje lista.');
      return;
    }

    var odgovor = ui.prompt(
      'Starost u mjesecima',
      'Do kog datuma se računa starost? (npr. 04.05.2026) — ostavi prazno za današnji datum.',
      ui.ButtonSet.OK_CANCEL
    );
    if (odgovor.getSelectedButton() !== ui.Button.OK) return;
    var uneseno = odgovor.getResponseText().trim();
    var referentniDatum = uneseno ? parsirajDatum_(uneseno) : new Date();
    if (!referentniDatum) {
      prikaziPoruku_('Neispravan datum', 'Datum "' + uneseno + '" nije prepoznat. Očekivan format: dd.mm.gggg (npr. 04.05.2026).');
      return;
    }

    var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return;
    var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var kolone = pronadjiKolone_(header, SPEC_STANJE);
    if (kolone.datumRodjenja === undefined) {
      prikaziPoruku_('Nije prepoznata kolona', 'Na listu "' + sheet.getName() + '" nije prepoznata kolona sa datumom rođenja (zaglavlje treba sadržavati "rođenja", npr. "Datum rođenja").');
      return;
    }

    var podaci = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var kolonaUpisa = 8; // kolona H
    var upisano = 0, preskoceno = 0;
    var rezultati = podaci.map(function (red) {
      var datumRodjenja = parsirajDatum_(red[kolone.datumRodjenja]);
      if (!datumRodjenja) { preskoceno++; return ['']; }
      upisano++;
      var dana = (referentniDatum - datumRodjenja) / 86400000;
      return [Math.round(dana / PROSJECNIH_DANA_U_MJESECU)];
    });
    sheet.getRange(2, kolonaUpisa, rezultati.length, 1).setValues(rezultati);
    var natpisDatuma = Utilities.formatDate(referentniDatum, Session.getScriptTimeZone(), 'dd.MM.yyyy.');
    sheet.getRange(1, kolonaUpisa).setValue('Starost (mjeseci) na dan ' + natpisDatuma);

    prikaziPoruku_(
      'Gotovo',
      'Upisana starost u mjesecima (kolona H) na dan ' + natpisDatuma + ' za ' + upisano + ' grla' +
      (preskoceno ? ' (' + preskoceno + ' redova preskočeno — nema prepoznatog datuma rođenja).' : '.')
    );
  } catch (e) {
    prikaziPoruku_('Greška', 'Izračun starosti nije uspio: ' + e.message);
    throw e;
  }
}

// Prihvata i pravi Date objekat (ćelija formatirana kao datum) i tekst u
// formatu dd.mm.gggg (uobičajen u ovim obrascima) ili gggg-mm-dd, uz opšti
// pokušaj preko Date parsera kao zadnju opciju. Vraća null ako ništa ne uspije.
function parsirajDatum_(vrijednost) {
  if (vrijednost instanceof Date) return isNaN(vrijednost.getTime()) ? null : vrijednost;
  var tekst = String(vrijednost === null || vrijednost === undefined ? '' : vrijednost).trim();
  if (!tekst) return null;
  var m = tekst.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (m) return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  m = tekst.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  var d = new Date(tekst);
  return isNaN(d.getTime()) ? null : d;
}

// ---------- OCR sa slike (besplatno, preko Drive/Docs OCR konverzije) ----------
//
// Zahtijeva JEDNOKRATNO podešavanje u Apps Script editoru: Services/Usluge
// (+ dugme) → dodaj "Drive API" (napredna Google usluga) → Sačuvaj. Bez
// ovoga funkcija javlja grešku sa uputom da ovo prvo uradiš.
//
// Kako se koristi: otpremi fotografiju fizičkog obrasca BILO GDJE na svoj
// Google Drive (slika ne mora biti u ovom fajlu ni umetnuta u list — slike
// umetnute direktno preko ćelija na listu nemaju dostupan sadržaj kroz Apps
// Script API), zatim pokreni "OCR sa slike" i zalijepi link za dijeljenje
// (ili sam ID fajla) kad te skripta pita. Skripta ne piše direktno u
// Stanje/Vakcinisano — rezultat ide u poseban list "OCR - pregled" da se
// PRIJE prepisivanja provjeri i ispravi (OCR sa skeniranog/fotografisanog
// obrasca nije 100% pouzdan, pogotovo za rukopis).

var NAZIV_OCR_LISTA = 'OCR - pregled';
var OCR_VRSTE = ['govedo', 'ovca', 'ovce', 'koza', 'koze', 'jagnjad', 'konj', 'svinja', 'tele', 'june'];

function ocrSaSlike() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  try {
    var odgovor = ui.prompt(
      'OCR sa slike',
      'Otpremi fotografiju obrasca na svoj Google Drive (bilo gdje), pa ovdje zalijepi link za dijeljenje ' +
      'ili sam ID fajla (desni klik na sliku u Drive-u → Nabavi link/Get link → zalijepi ovdje).',
      ui.ButtonSet.OK_CANCEL
    );
    if (odgovor.getSelectedButton() !== ui.Button.OK) return;
    var unos = odgovor.getResponseText().trim();
    if (!unos) {
      prikaziPoruku_('Nema unosa', 'Nije unesen link ili ID slike.');
      return;
    }

    var idFajla = izvuciDriveId_(unos);
    if (!idFajla) {
      prikaziPoruku_('Neprepoznat link', 'Nije prepoznat Drive ID u unesenom tekstu: "' + unos + '". Zalijepi puni link za dijeljenje (Get link) ili sam ID fajla.');
      return;
    }

    var blob;
    try {
      blob = DriveApp.getFileById(idFajla).getBlob();
    } catch (e2) {
      prikaziPoruku_('Slika nije pronađena', 'Fajl sa ID-om "' + idFajla + '" nije nađen ili nemaš pristup njemu. Provjeri link i da je slika dijeljena barem sa tobom.');
      return;
    }

    var tekst = ocrujBlob_(blob);
    var linije = tekst.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 0; });

    if (!linije.length) {
      prikaziPoruku_('Ništa pročitano', 'OCR nije uspio pročitati tekst sa slike. Probaj jasniju/oštriju fotografiju.');
      return;
    }

    var redovi = linije.map(parsirajOcrLiniju_).filter(function (r) { return r; });
    upisiOcrPregled_(ss, redovi, linije.length);

    prikaziPoruku_(
      'Gotovo',
      'OCR pročitao ' + linije.length + ' linija teksta, izdvojeno ' + redovi.length +
      ' red(ova) sa nečim što liči na markicu, upisano u list "' + NAZIV_OCR_LISTA + '". ' +
      '⚠ PROVJERI I ISPRAVI prije nego ručno prepišeš u Stanje/Vakcinisano — OCR nije 100% pouzdan.'
    );
  } catch (e) {
    var savjet = e.message && e.message.indexOf('Drive') !== -1
      ? ' Provjeri da je "Drive API" dodat kao napredna usluga (Services/Usluge → + → Drive API) u ovom Apps Script projektu.'
      : '';
    prikaziPoruku_('Greška', 'OCR nije uspio: ' + e.message + savjet);
    throw e;
  }
}

// Izvlači Drive ID fajla iz punog linka za dijeljenje (npr.
// ".../file/d/<ID>/view?usp=sharing" ili "...?id=<ID>") ili prihvata sam ID
// ako je to sve što je zalijepljeno. Drive ID-jevi su dovoljno dugi
// (25+ znakova slova/brojeva/crtica) da se pouzdano razlikuju od ostatka
// URL-a (domen, "file", "view" i sl. su svi kraći od toga).
function izvuciDriveId_(tekst) {
  var m = String(tekst || '').match(/[-\w]{25,}/);
  return m ? m[0] : null;
}

// Konvertuje sliku u privremeni Google Doc uz OCR (besplatno, koristi Drive/
// Docs OCR konverziju), vrati prepoznati tekst, pa odmah obriše privremeni
// fajl. Zahtijeva naprednu Drive uslugu (vidi napomenu na vrhu sekcije).
function ocrujBlob_(blob) {
  var resource = { title: 'OCR privremeno', mimeType: MimeType.GOOGLE_DOCS };
  var opcije = { ocr: true, ocrLanguage: 'hr' };
  var fajl = Drive.Files.insert(resource, blob, opcije);
  try {
    var dokument = DocumentApp.openById(fajl.id);
    return dokument.getBody().getText();
  } finally {
    DriveApp.getFileById(fajl.id).setTrashed(true);
  }
}

// Best-effort izdvajanje jednog reda (Rb, markica, pol, vrsta) iz JEDNE
// linije OCR teksta — OCR sa fizičkog obrasca često pomiješa razmake i
// brojeve s tekstom, pa je ovo namjerno permisivno, ne strogo poređenje kao
// za direktan unos u ćeliju. Vraća null ako linija uopšte ne sadrži nešto
// što liči na markicu (npr. naslovni/prazan red obrasca).
function parsirajOcrLiniju_(linija) {
  var markica = izvuciMarkicuIzOcrTeksta_(linija);
  if (!markica) return null;

  var rbMatch = linija.match(/^\s*(\d{1,4})\D/);
  var rb = rbMatch ? rbMatch[1] : '';

  var velikaLinija = linija.toUpperCase();
  var pol = '';
  if (/(^|[^A-ZŽĆČĐŠ])M([^A-ZŽĆČĐŠ]|$)/.test(velikaLinija)) pol = 'M';
  else if (/(^|[^A-ZŽĆČĐŠ])Ž([^A-ZŽĆČĐŠ]|$)/.test(velikaLinija)) pol = 'Ž';

  var vrsta = '';
  var cistaLinija = ocistiTekst_(linija);
  for (var i = 0; i < OCR_VRSTE.length; i++) {
    if (cistaLinija.indexOf(OCR_VRSTE[i]) !== -1) { vrsta = OCR_VRSTE[i]; break; }
  }

  return { rb: rb, markica: markica, pol: pol, vrsta: vrsta, izvor: linija };
}

// Izdvaja markicu iz proizvoljne (šumovite) OCR linije — prvo traži "BA" +
// brojevi (uobičajen format), a ako toga nema, kao zadnji pokušaj traži bilo
// koji niz od bar 6 cifara (dovoljno dugačak da ne pokupi Rb ili slično
// kratak broj kao markicu).
function izvuciMarkicuIzOcrTeksta_(linija) {
  var tekst = linija.toUpperCase();
  var m = tekst.match(/BA[ \t]*\d[\d \t]{5,15}\d/);
  if (m) return m[0].replace(/[ \t]+/g, '');
  m = tekst.match(/\d{6,}/);
  return m ? m[0] : null;
}

function upisiOcrPregled_(ss, redovi, ukupnoLinija) {
  var sheet = ss.getSheetByName(NAZIV_OCR_LISTA);
  if (sheet) { sheet.clear(); sheet.clearFormats(); }
  else { sheet = ss.insertSheet(NAZIV_OCR_LISTA); }

  sheet.getRange(1, 1, 1, 5).setValues([['Rb (nagađanje)', 'Markica', 'Pol (nagađanje)', 'Vrsta (nagađanje)', 'Sirova OCR linija']])
    .setFontWeight('bold').setBackground(BOJE.ink).setFontColor(BOJE.paper).setFontFamily(FONT_TEKST);

  if (redovi.length) {
    var vrijednosti = redovi.map(function (r) { return [r.rb, r.markica, r.pol, r.vrsta, r.izvor]; });
    sheet.getRange(2, 1, vrijednosti.length, 5).setValues(vrijednosti).setFontFamily(FONT_TEKST);
  }
  sheet.autoResizeColumns(1, 4);
  sheet.setColumnWidth(5, 400);

  sheet.getRange(redovi.length + 3, 1, 1, 5).merge().setValue(
    '⚠ OCR nije 100% pouzdan — provjeri svaki red (posebno markicu) prije nego prepišeš u Stanje/Vakcinisano. ' +
    'Pročitano ' + ukupnoLinija + ' linija teksta ukupno, ' + redovi.length + ' sadrži nešto što liči na markicu.'
  ).setFontStyle('italic').setFontColor(BOJE.crvenaFg).setWrap(true);
}
