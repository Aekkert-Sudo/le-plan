# L & E Plan für Windows

Baut eine Setup.exe, die L & E Plan offline auf Windows installiert.
Die App hat oben das Menü **Update → Nach Update suchen** und holt sich die neue Version von https://aekkert-sudo.github.io/le-plan/.
Beim Start sieht sie auch selbst nach (ohne Internet passiert nichts). Pläne bleiben bei Updates erhalten.

Bauen (Linux, braucht `makensis`): `npm install && npm run dist` → `dist/L-und-E-Plan-Setup.exe`

**Wichtig bei jeder Änderung an index.html:** die Zahl in `<!-- leplan-ver:JJJJMMTTHHMM -->` (im `<head>`) erhöhen.
Die Windows-App bietet ein Update nur an, wenn diese Zahl im Netz größer ist als bei ihr.
