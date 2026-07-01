@echo off
echo ========================================
echo  BrandGEO - Push Both Repos to GitHub
echo ========================================
echo.

echo [1/2] Pushing BpR repo...
cd /d "C:\Users\const\Desktop\BpR"
del /f ".git\index.lock" 2>nul
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: BpR push failed
    pause
    exit /b 1
)
echo BpR pushed OK

echo.
echo [2/2] Pushing bpr-geo-monitor repo...
cd /d "C:\Users\const\bpr-geo-monitor"
del /f ".git\index.lock" 2>nul
git push origin master
if %errorlevel% neq 0 (
    echo ERROR: bpr-geo-monitor push failed
    pause
    exit /b 1
)
echo bpr-geo-monitor pushed OK

echo.
echo ========================================
echo  DONE - Both repos pushed to GitHub!
echo ========================================
pause
