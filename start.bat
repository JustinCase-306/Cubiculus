@echo off
REM ============================================================
REM  BrowserCraft - Einfacher Server-Start
REM  Einfach doppelklicken. Fehler werden in start.log geschrieben.
REM ============================================================
setlocal
title BrowserCraft Server
cd /d "%~dp0"

echo ================================================ > start.log
echo  BrowserCraft Server Start - %date% %time%      >> start.log
echo ================================================ >> start.log

REM 1) Abhaengigkeiten installieren (nur wenn nicht vorhanden)
if not exist node_modules (
    echo [1/3] Installiere Abhaengigkeiten...
    call npm install >> start.log 2>&1
    if errorlevel 1 (
        echo [FEHLER] npm install schlug fehl. >> start.log
        echo FEHLER: npm install schlug fehl.
        pause
        exit /b 1
    )
)

REM 2) Browser spaeter automatisch oeffnen (Verzoegerung 3s)
echo [2/3] Oeffne Browser in 3 Sekunden...
start "" /b cmd /c "ping -n 4 127.0.0.1 >nul & start http://localhost:3000"

REM 3) Dev-Server starten (Endlos, Stopp mit STRG+C)
echo [3/3] Server unter http://localhost:3000
echo        Zum Stoppen: STRG+C
call npm run dev >> start.log 2>&1

echo.
echo Server beendet.
pause
endlocal