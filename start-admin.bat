@echo off
echo ========================================================
echo Starting Mazhalai Admin Dashboard...
echo ========================================================
echo.
echo Installing dependencies (this might take a moment if it's your first time)...
cd admin
call npm install
echo.
echo Starting the development server...
call npm run dev 
 1pause