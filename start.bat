@echo off
title StagePath Launcher
echo ===================================================
echo   Lancement de l'application StagePath...
echo ===================================================
echo.
echo Activation du serveur de developpement et ouverture du navigateur...
echo.
npm run dev -- --open
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Le serveur n'a pas pu demarrer. Assurez-vous que Node.js est installe.
    pause
)
