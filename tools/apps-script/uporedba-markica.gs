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
 * fiksnoj poziciji.
 *
 * Meni "Markice" > "Uporedi / osvježi" upiše rezultat u novi/postojeći list
 * "Uporedba markica": rekap sa statistikom (broj grla, broj i postotak
 * vakcinisanih, broj nevakcinisanih, broj vakcinisanih van spiska) i punu
 * tabelu markica sa statusom i po-bolest kolonama, obojenu isto kao u
 * aplikaciji (zeleno = vakcinisano, crveno = nije, žuto = vakcinisano ali
 * van spiska grla).
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
  { key: 'pol', kw: ['pol', 'spol'] }
];
var SPEC_VAK_OSNOVNO = [
  { key: 'drzava', kw: ['drzava'] },
  { key: 'markica', kw: ['markic'] },
  { key: 'broj', kw: ['identifikacij'] },
  { key: 'vrsta', kw: ['vrsta'] },
  { key: 'pol', kw: ['pol', 'spol'] }
];
var BOLESTI = [
  { key: 'bruceloza', naziv: 'Bruceloza', kw: ['brucel'] },
  { key: 'leukoza', naziv: 'Enzotska leukoza', kw: ['leukoz'] },
  { key: 'tbc', naziv: 'TBC', kw: ['tbc', 'tuberkuloz'] },
  { key: 'cmt', naziv: 'CMT', kw: ['cmt'] },
  { key: 'antraks', naziv: 'Antrax', kw: ['antraks', 'anthrax'] }
];

var BOJE = {
  zelenaBg: '#e3f0e3', zelenaFg: '#2e6b2e',
  crvenaBg: '#f5ddd6', crvenaFg: '#b23a2e',
  zutaBg: '#fbf0d8', zutaFg: '#8a6516',
  sivaBg: '#f4f1ea', sivaFg: '#6b6355',
  zaglavljeBg: '#3a3f2e', zaglavljeFg: '#ffffff'
};

// ---------- meni ----------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Markice')
    .addItem('Uporedi / osvježi "Uporedba markica"', 'uporediMarkice')
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

    upisiRezultat_(ss, listovi, podaci, rezultat, stanje.mapa, vak.mapa, stanje.preskoceno, vak.preskoceno);

    var izlazniList = ss.getSheetByName(NAZIV_IZLAZNOG_LISTA);
    ss.setActiveSheet(izlazniList);
    prikaziPoruku_(
      'Gotovo',
      'Upisano u list "' + NAZIV_IZLAZNOG_LISTA + '": ' + rezultat.roster.length + ' grla na spisku, ' +
      rezultat.podudara.length + ' vakcinisano (' + rezultat.postotak + '%).'
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

  var listPodaci = pronadjiListPoNazivu_(sheets, ['podaci', 'vlasnik']);
  var listStanje = pronadjiListPoNazivu_(sheets, ['stanj', 'roster', 'grla']);
  var listVak = pronadjiListPoNazivu_(sheets, ['vakcin']);

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
      else if (pogodak === 'stanje' && !listStanje) listStanje = sh;
    }
  }

  return { podaci: listPodaci, stanje: listStanje, vak: listVak };
}

function pronadjiListPoNazivu_(sheets, kljucneRijeci) {
  for (var i = 0; i < sheets.length; i++) {
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
function pogodiVrstuLista_(headerRow) {
  if (izgledaKaoPodaci_(headerRow)) return 'podaci';
  var osnovno = pronadjiKolone_(headerRow, SPEC_VAK_OSNOVNO);
  var bolesti = pronadjiKolone_(headerRow, BOLESTI);
  var imaMarkicu = osnovno.markica !== undefined || osnovno.broj !== undefined;
  if (!imaMarkicu) return null;
  return Object.keys(bolesti).length ? 'vak' : 'stanje';
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

// Izvlači sve BA+brojevi oznake iz teksta (velika slova, razmaci/tabovi
// unutar oznake su dozvoljeni pa se uklone) — ista logika kao normalize()
// u web aplikaciji, da se ista markica upisana sa ili bez razmaka prepozna
// kao ista, i da zalijepljen sadržaj s više oznaka u jednoj ćeliji ne
// pokvari poređenje.
function izvuciMarkice_(raw) {
  var text = (raw === null || raw === undefined ? '' : String(raw)).toUpperCase();
  var matches = text.match(/BA[ \t]*\d[\d \t]{5,15}\d/g) || [];
  return matches.map(function (m) { return m.replace(/[ \t]+/g, ''); });
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
  if (!sheet) return { mapa: mapa, preskoceno: preskoceno };
  var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return { mapa: mapa, preskoceno: preskoceno };
  var podaci = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var kolone = pronadjiKolone_(podaci[0], SPEC_STANJE);
  for (var i = 1; i < podaci.length; i++) {
    var red = podaci[i];
    var sirovaMarkica = kolone.markica !== undefined ? red[kolone.markica] : '';
    var markice = izvuciMarkice_(sirovaMarkica);
    if (!markice.length) { if (redImaSadrzaj_(red)) preskoceno++; continue; }
    var markica = markice[0];
    if (!mapa[markica]) {
      mapa[markica] = {
        pol: kolone.pol !== undefined ? normalizujPol_(red[kolone.pol]) : '',
        vrsta: kolone.vrsta !== undefined ? String(red[kolone.vrsta] || '').trim() : ''
      };
    }
  }
  return { mapa: mapa, preskoceno: preskoceno };
}

// Vraća {mapa: {markica: {pol, vrsta, bolesti:{...}}}, preskoceno}. Markica
// zapisana u dvije kolone (Država + broj, npr. "BA" + "4200571206") se
// spaja prije prepoznavanja, kao i u web aplikaciji.
function procitajVakcinisano_(sheet) {
  var mapa = {};
  var preskoceno = 0;
  if (!sheet) return { mapa: mapa, preskoceno: preskoceno };
  var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return { mapa: mapa, preskoceno: preskoceno };
  var podaci = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var header = podaci[0];
  var kolone = pronadjiKolone_(header, SPEC_VAK_OSNOVNO);
  var boljeKolone = pronadjiKolone_(header, BOLESTI);
  for (var i = 1; i < podaci.length; i++) {
    var red = podaci[i];
    var sirovaMarkica;
    if (kolone.markica !== undefined) {
      sirovaMarkica = red[kolone.markica];
    } else {
      var drzava = kolone.drzava !== undefined ? red[kolone.drzava] : '';
      var broj = kolone.broj !== undefined ? red[kolone.broj] : '';
      sirovaMarkica = String(drzava || '') + String(broj || '');
    }
    var markice = izvuciMarkice_(sirovaMarkica);
    if (!markice.length) { if (redImaSadrzaj_(red)) preskoceno++; continue; }
    var markica = markice[0];
    if (!mapa[markica]) {
      var bolesti = {};
      for (var b = 0; b < BOLESTI.length; b++) {
        var key = BOLESTI[b].key;
        bolesti[key] = boljeKolone[key] !== undefined ? String(red[boljeKolone[key]] || '').trim() : '';
      }
      mapa[markica] = {
        pol: kolone.pol !== undefined ? normalizujPol_(red[kolone.pol]) : '',
        vrsta: kolone.vrsta !== undefined ? String(red[kolone.vrsta] || '').trim() : '',
        bolesti: bolesti
      };
    }
  }
  return { mapa: mapa, preskoceno: preskoceno };
}

// ---------- poređenje ----------

function izracunajUporedbu_(stanjeMapa, vakMapa) {
  var roster = Object.keys(stanjeMapa).sort();
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

// ---------- ispis rezultata ----------

function upisiRezultat_(ss, listovi, podaci, rezultat, stanjeMapa, vakMapa, preskocenoStanje, preskocenoVak) {
  var sheet = ss.getSheetByName(NAZIV_IZLAZNOG_LISTA);
  if (sheet) {
    sheet.clear();
    sheet.clearFormats();
  } else {
    sheet = ss.insertSheet(NAZIV_IZLAZNOG_LISTA);
  }

  var brojKolona = 4 + BOLESTI.length; // Markica, Status, Pol, Vrsta + 5 bolesti
  sheet.setColumnWidths(1, brojKolona, 130);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 60);
  sheet.setColumnWidth(4, 110);

  var naslov = 'Uporedba markica' + (podaci.vlasnik ? ' — ' + podaci.vlasnik : '');
  sheet.getRange(1, 1).setValue(naslov).setFontSize(16).setFontWeight('bold');

  var podnaslovDijelovi = [];
  if (podaci.sifraImanja) podnaslovDijelovi.push('Šifra imanja: ' + podaci.sifraImanja);
  if (podaci.adresaMjesto) podnaslovDijelovi.push(podaci.adresaMjesto);
  podnaslovDijelovi.push('Generisano: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Sarajevo', 'dd.MM.yyyy. HH:mm'));
  sheet.getRange(2, 1).setValue(podnaslovDijelovi.join('   ·   ')).setFontColor(BOJE.sivaFg).setFontSize(10);

  // ---- rekap sa statistikom (4 kartice) ----
  var statLabele = ['Grla na spisku', 'Vakcinisano', 'Nije vakcinisano', 'Vakcinisano, van spiska'];
  var statVrijednosti = [
    rezultat.roster.length,
    rezultat.podudara.length + (rezultat.roster.length ? ' (' + rezultat.postotak + '%)' : ''),
    rezultat.nijeVakcinisano.length,
    rezultat.nijeUSpisku.length
  ];
  var redLabela = 4, redVrijednosti = 5;
  sheet.getRange(redLabela, 1, 1, 4).setValues([statLabele])
    .setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center').setWrap(true);
  sheet.getRange(redVrijednosti, 1, 1, 4).setValues([statVrijednosti])
    .setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.setRowHeight(redLabela, 30);
  sheet.setRowHeight(redVrijednosti, 34);

  var kartice = [
    { kol: 1, bg: BOJE.sivaBg, fg: '#1f2a1f' },
    { kol: 2, bg: BOJE.zelenaBg, fg: BOJE.zelenaFg },
    { kol: 3, bg: BOJE.crvenaBg, fg: BOJE.crvenaFg },
    { kol: 4, bg: BOJE.zutaBg, fg: BOJE.zutaFg }
  ];
  kartice.forEach(function (k) {
    var opseg = sheet.getRange(redLabela, k.kol, 2, 1);
    opseg.setBackground(k.bg);
    sheet.getRange(redVrijednosti, k.kol).setFontColor(k.fg);
  });

  var sljedeciRed = redVrijednosti + 2;

  var ukupnoPreskoceno = preskocenoStanje + preskocenoVak;
  if (ukupnoPreskoceno > 0) {
    var poruka = ukupnoPreskoceno + ' red(ova) preskočeno — markica nije prepoznata ' +
      '(očekuje se "BA" + brojevi), provjeri format u originalnom fajlu.';
    sheet.getRange(sljedeciRed, 1).setValue('⚠ ' + poruka)
      .setFontColor(BOJE.crvenaFg).setFontStyle('italic').setFontSize(10);
    sljedeciRed += 2;
  }

  var zaglavljeTabele = ['Markica', 'Status', 'Pol', 'Vrsta'].concat(BOLESTI.map(function (b) { return b.naziv; }));

  if (!rezultat.roster.length && !rezultat.nijeUSpisku.length) {
    sheet.getRange(sljedeciRed, 1).setValue('Nema podataka za prikaz — provjeri da listovi Stanje/Vakcinisano imaju popunjene redove.')
      .setFontStyle('italic').setFontColor(BOJE.sivaFg);
    sheet.setFrozenRows(3);
    return;
  }

  sljedeciRed = upisiTabeluMarkica_(
    sheet, sljedeciRed, 'Spisak grla (' + rezultat.roster.length + ')',
    zaglavljeTabele, rezultat.roster, stanjeMapa, vakMapa, true
  );

  if (rezultat.nijeUSpisku.length) {
    sljedeciRed += 1;
    sljedeciRed = upisiTabeluMarkica_(
      sheet, sljedeciRed,
      'Vakcinisano, van spiska grla (' + rezultat.nijeUSpisku.length + ') — nije na spisku grla, moguća greška u unosu',
      zaglavljeTabele, rezultat.nijeUSpisku, stanjeMapa, vakMapa, false
    );
  }

  sheet.setFrozenRows(3);
}

// Ispisuje naslov sekcije + tabelu markica počevši od zadanog reda, vraća
// prvi slobodan red poslije tabele. `jeRoster` bira da li se markice boje
// prema tome jesu li vakcinisane (spisak grla) ili se sve boje žuto
// (spisak "van spiska", gdje je sama pojava na listi već anomalija).
function upisiTabeluMarkica_(sheet, red, naslovSekcije, zaglavlje, markiceLista, stanjeMapa, vakMapa, jeRoster) {
  sheet.getRange(red, 1).setValue(naslovSekcije).setFontWeight('bold').setFontSize(11);
  red += 1;

  sheet.getRange(red, 1, 1, zaglavlje.length).setValues([zaglavlje])
    .setFontWeight('bold').setFontColor(BOJE.zaglavljeFg).setBackground(BOJE.zaglavljeBg);
  var zaglavljeRed = red;
  red += 1;

  var redovi = markiceLista.map(function (markica) {
    var vakInfo = vakMapa[markica];
    var stanjeInfo = stanjeMapa[markica];
    var vakcinisano = !!vakInfo;
    var status = vakcinisano ? 'Vakcinisano ✓' : 'Nije vakcinisano';
    var izvor = stanjeInfo || vakInfo || {};
    var bolestiVrijednosti = BOLESTI.map(function (b) {
      return vakInfo && vakInfo.bolesti ? (vakInfo.bolesti[b.key] || '') : '';
    });
    return {
      red: [markica, status, izvor.pol || '', izvor.vrsta || ''].concat(bolestiVrijednosti),
      vakcinisano: vakcinisano
    };
  });

  if (redovi.length) {
    sheet.getRange(red, 1, redovi.length, zaglavlje.length)
      .setValues(redovi.map(function (r) { return r.red; }));

    for (var i = 0; i < redovi.length; i++) {
      var opseg = sheet.getRange(red + i, 1, 1, zaglavlje.length);
      if (!jeRoster) {
        opseg.setBackground(BOJE.zutaBg).setFontColor(BOJE.zutaFg);
      } else if (redovi[i].vakcinisano) {
        opseg.setBackground(BOJE.zelenaBg).setFontColor(BOJE.zelenaFg);
      } else {
        opseg.setBackground(BOJE.crvenaBg).setFontColor(BOJE.crvenaFg);
      }
    }
  } else {
    sheet.getRange(red, 1).setValue('— nema —').setFontStyle('italic').setFontColor(BOJE.sivaFg);
  }

  var brojRedova = Math.max(redovi.length, 1);
  sheet.getRange(zaglavljeRed, 1, brojRedova + 1, zaglavlje.length).setBorder(true, true, true, true, true, true, '#cfc9b8', SpreadsheetApp.BorderStyle.SOLID);

  return zaglavljeRed + brojRedova + 1;
}
