1. Git-Repository initialisieren
   Öffne dein Terminal (z. B. PowerShell) im Stammordner deines Monorepos (in deinem Fall im Verzeichnis C:\Users\info\Documents\Discord Bot\Pyro-monorepo-1.0) und führe folgende Befehle aus:

bash
Kopieren
git init
Damit wird im aktuellen Ordner ein lokales Git-Repository erstellt.

2. Erste Commits erstellen
   Füge alle Dateien dem Staging-Bereich hinzu und erstelle deinen ersten Commit:

bash
Kopieren
git add .
git commit -m "Initial commit" 3. Remote-Repository hinzufügen
Füge das entfernte Repository (GitHub) als Remote hinzu. Verwende dazu den Repository-Link, den du bereits erstellt hast (in deinem Fall: https://github.com/Since120/pyro.git):

bash
Kopieren
git remote add origin https://github.com/Since120/pyro.git
Überprüfe mit:

bash
Kopieren
git remote -v
Sollte die Ausgabe in etwa so aussehen:

bash
Kopieren
origin https://github.com/Since120/pyro.git (fetch)
origin https://github.com/Since120/pyro.git (push) 4. Auf den main-Branch pushen
Falls dein lokaler Branch noch nicht main heißt (bei Git-Initialisierung heißt er oft „master“), kannst du den Branch umbenennen oder direkt main verwenden. Zum Beispiel:

bash
Kopieren
git branch -M main
Dann pushe den main-Branch zu GitHub:

bash
Kopieren
git push -u origin main
Der Schalter -u (bzw. --set-upstream) sorgt dafür, dass dein lokaler Branch mit dem Remote-Branch verknüpft wird.

5. Einen neuen Feature-Branch erstellen
   Sobald main online ist, kannst du einen neuen Branch für dein erstes Feature erstellen. Branch-Namen sollten keine Sonderzeichen enthalten – ich schlage z. B. den Namen zone-and-category vor:

bash
Kopieren
git checkout -b zone-and-category
Um den neuen Branch auch ins Remote-Repository zu pushen, führe aus:

bash
Kopieren
git push -u origin zone-and-category

Prüfen wo ich bin
git status





mkdir -p ~/projects
ln -s "/mnt/c/Users/info/Documents/Discord Bot/Pyro" ~/projects/pyro
cd ~/projects/pyro
claude
