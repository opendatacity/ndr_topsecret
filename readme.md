# FBO - Federal Business Opportunities

Auf `ftp://ftp.fbo.gov` befinden sich alle benötigten Daten. Wir benötigen davon die beiden Verzeichnisse:

- `ftp://ftp.fbo.gov/FBORecovery`
- `ftp://ftp.fbo.gov/FBORecoveryAwards`

Beide Verzeichnis runterladen (z.B. mit CyberDuck-Folder-Syncing) in

- `./cache/FBO/FBORecovery/`
- `./cache/FBO/FBORecoveryAwards/`

Das Script unter `./node/fbo_scraper.js` lädt die Daten, säubert sie und speichert sie als TSV unter `./results/fbo-data.tsv`. Der Header der TSV wird als `./results/fbo-head.tsv` gespeichert.

Header und Data einfach mit `cat fbo-head.tsv fbo-data.tsv > fbo.tsv` miteinander verbinden.

# FPDS - Federal Procurement Data System

