@echo off
title Envoi du code sur GitHub
echo ============================================
echo   Envoi de Mon Budget vers votre GitHub
echo ============================================
echo.
echo Une fenetre de connexion GitHub dans votre navigateur peut s'ouvrir.
echo.
cd /d "%~dp0"
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================
    echo   SUCCES ! Votre code est bien sur GitHub.
    echo ============================================
) else (
    echo Une erreur est survenue lors de l'envoi.
)
echo.
pause
