# L & E Plan für Windows

Baut eine Setup.exe, die L & E Plan offline auf Windows installiert.
Die App hat oben das Menü **Update → Nach Update suchen** und holt sich die neue Version von https://aekkert-sudo.github.io/le-plan/.
Beim Start sieht sie auch selbst nach (ohne Internet passiert nichts). Pläne bleiben bei Updates erhalten.

Bauen (Linux, braucht `makensis`): `npm install && npm run dist` → `dist/L-und-E-Plan-Setup.exe`
