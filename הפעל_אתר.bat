@echo off
echo.
echo ========================================
echo   המטייל החכם - שרת מקומי
echo ========================================
echo.
echo פותח את האתר בכתובת: http://localhost:8080
echo.
echo כדי לסגור את השרת - סגור חלון זה
echo.
cd /d "%~dp0"
start "" "http://localhost:8080"
python -m http.server 8080
