@echo off
echo Starting Rephrasely in debug mode...
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Contents of dist folder:
dir dist
echo.
echo Starting executable...
"dist\Rephrasely 0.1.0.exe"
pause
