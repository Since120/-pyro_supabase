#########################################################################
# CopyFilePathsAndContentsAsText.ps1
#
# Dieses Script durchsucht rekursiv das Projektverzeichnis (den Ordner, in
# dem dieses Script liegt) nach Dateien mit den Endungen .js, .ts und .tsx.
#
# Dabei werden bestimmte Ordner, in denen ungewünschte Dateien liegen, vom
# Durchsuchen ausgeschlossen (z. B. node_modules, dist und .next).
#
# Zusätzlich werden nur Dateien berücksichtigt, deren relativer Pfad (vom 
# Projekt‑Root) mit einem der in $allowedDirs definierten Ordner beginnt.
#
# Für jede gefundene Datei wird:
#   - der relative Pfad (z. B. "src\app\index.js" oder ".\index.js" für Dateien
#     im Root) ermittelt,
#   - der komplette Inhalt der Datei als Text gelesen.
#
# Die Ausgabe besteht aus:
#   - Einer Zeile mit dem relativen Pfad,
#   - Direkt darunter folgt der gesamte Inhalt der Datei,
#   - Zwischen den Einträgen wird eine Leerzeile eingefügt.
#
# Das Ergebnis wird als reiner Text in die Zwischenablage kopiert, sodass Sie
# ihn in einen Editor einfügen und weiterverarbeiten können.
#########################################################################

# Ermitteln des Projekt-Root (Ordner, in dem dieses Script liegt)
$root = $PSScriptRoot

# --- Whitelist: Nur Dateien aus diesen (relativen) Ordnern sollen berücksichtigt werden ---
$allowedDirs = @(
    "apps\dashboard\src\hooks",
    "apps\dashboard\src\lib",
    "apps\dashboard\src\graphql",
    "apps\dashboard\src\components\dashboard\category",
    "apps\dashboard\src\components\ClientSnackbarProvider.tsx",
    "apps\dashboard\src\app\layout.tsx",
    "apps\dashboard\src\components\core\async.action.modal.tsx",
    "apps\dashboard\src\components\core\discord.role.select.tsx",
    "apps\dashboard\src\components\core\picker.text.field.tsx",
    "apps\dashboard\src\components\core\setup.stepper.tsx"


)

# --- Blacklist: Dateien, deren relativer Pfad eines dieser Stichwörter enthaltet, sollen NICHT verarbeitet werden ---
$blacklistedDirs = @(
    "node_modules",
    "dist"

)


# Rekursives Suchen aller Dateien mit den gewünschten Endungen
$files = Get-ChildItem -Path $root -Recurse -File -Include *.ts,*.tsx |
    Where-Object {
        # Gesamter Dateipfad
        $path = $_.FullName
        # Ermitteln des relativen Pfads (ohne führenden Backslash)
        $relativePath = $path.Substring($root.Length).TrimStart('\')
        
        # Prüfen, ob der relative Pfad mit einem der erlaubten Ordner beginnt
        $isAllowed = $false
        foreach ($dir in $allowedDirs) {
            if ($relativePath -like ("{0}*" -f $dir)) {
                $isAllowed = $true
                break
            }
        }
        
        # Prüfen, ob der relative Pfad einen der unerwünschten (blacklisted) Ordner enthält.
        $isBlacklisted = $false
        foreach ($bad in $blacklistedDirs) {
            # Hier wird davon ausgegangen, dass der Ordnername im Pfad immer von Backslashes
            # umschlossen ist (z. B. "\node_modules\"). Anpassen, falls erforderlich.
            if ($relativePath -match "\\$bad\\") {
                $isBlacklisted = $true
                break
            }
        }
        
        # Die Datei wird nur berücksichtigt, wenn sie in einem erlaubten Ordner liegt UND
        # kein blacklisted Muster im relativen Pfad enthält.
        $isAllowed -and (-not $isBlacklisted)
    }

# Initialisieren der Variable, in der der gesamte Ausgabetext gespeichert wird
$output = ""

foreach ($file in $files) {
    # Berechnen des relativen Pfads inkl. Dateinamen:
    if ($file.DirectoryName -eq $root) {
        $relativePath = ".\" + $file.Name
    }
    else {
        $relativeDir = $file.DirectoryName.Substring($root.Length).TrimStart('\')
        $relativePath = $relativeDir + "\" + $file.Name
    }
    
    # Dateiinhalt als Text lesen (-Raw, um den kompletten Inhalt als einen String zu erhalten)
    $content = Get-Content -Path $file.FullName -Raw
    
    # Zusammenstellen des Eintrags: relative Pfadangabe, Zeilenumbruch, Dateiinhalt, doppelter Zeilenumbruch
    $entry = $relativePath + "`r`n" + $content + "`r`n`r`n"
    $output += $entry
}

# Den finalen Text in die Zwischenablage kopieren, falls Einträge vorhanden sind
if ($output -ne "") {
    Set-Clipboard -Value $output
    Write-Host "Die Dateipfade und deren Inhalte wurden als Text in die Zwischenablage kopiert." -ForegroundColor Green
} else {
    Write-Host "Es wurden keine Dateien mit den angegebenen Endungen gefunden." -ForegroundColor Yellow
}
