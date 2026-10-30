@echo off
title HIS SQL Assistant - Local
echo ========================================================
echo   HIS SQL Assistant - Khoi chay 1 lenh duy nhat
echo ========================================================
echo.
echo   [1] Chay ban All-in-One (Giao dien + API chung port 3000)
echo   [2] Chay che do Dev (Hot-reload Frontend 5173 + Backend 3000)
echo.
set /p choice="Nhap lua chon [1 hoac 2, mac dinh 1]: "
if "%choice%"=="2" (
  echo.
  echo Dang khoi dong che do Dev...
  npm run dev
) else (
  echo.
  echo Dang khoi dong All-in-One tai http://localhost:3000 ...
  npm start
)
pause
