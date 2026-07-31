@echo off
cd /d "%~dp0"
echo === GEO Intelligence - Name Intelligence Tool ===
echo Installing required packages...
pip install python-whois aiohttp python-dotenv -q
echo.
echo Generating and scoring 200 product name candidates...
echo This will take 3-5 minutes.
echo.
python name_intelligence.py
echo.
pause
