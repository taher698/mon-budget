@echo off
title Mon Budget - Expo
echo ========================================
echo   Lancement de votre application Mobile
echo ========================================
echo.
echo Assurez-vous d'avoir installe l'application "Expo Go" sur votre iPhone.
echo.
cd /d "%~dp0"
call npx expo start
pause
