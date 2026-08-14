# Napomene za Claude Code u ovom repozitoriju

## Verzioniranje — obavezno pri svakom commitu

Svaki commit koji mijenja kod aplikacije (`index.html`, `sw.js`, `manifest.json`) mora podići broj verzije, na sva tri mjesta odjednom:

- `APP_VERZIJA` u `index.html`
- `CACHE_NAME` u `sw.js` (npr. `markice-cache-v1.2`)
- `"version"` polje u `manifest.json`

Nakon commita, **reci korisniku novu verziju** (npr. "Commitovano kao v1.2.").

Ne treba bumpati verziju za promjene koje ne diraju `index.html`/`sw.js`/`manifest.json` (npr. samo `README.md` ili `TODO.md`).

Sitne izmjene (bugfix, manji UI detalj) → podigni zadnji broj (1.1 → 1.2).
Veće nove funkcionalnosti → po nahođenju, isto zadnji broj je ok osim ako korisnik traži drugačije.
