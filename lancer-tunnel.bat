@echo off
title Mon Budget - Expo (Mode Tunnel)
echo ========================================================
echo   Lancement de votre application Mobile (Mode Tunnel)
echo   (Utile si l'iPhone et le PC ne sont pas sur la meme box)
echo ========================================================
echo.
cd /d "%~dp0"
call npx expo start --tunnel
pause
