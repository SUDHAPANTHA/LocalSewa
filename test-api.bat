@echo off
REM API Testing Script for Local Sewa App (Windows)
REM Run this to test if backend APIs are working

echo Testing Local Sewa Backend APIs...
echo.

set BASE_URL=http://localhost:5000

REM Test 1: Get all services
echo 1. Testing GET /services
curl -s "%BASE_URL%/services" > temp_response.txt
if %ERRORLEVEL% EQU 0 (
    echo [OK] Services API working
    type temp_response.txt | findstr /C:"success" > nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Response contains success
    ) else (
        echo [WARN] Response may be invalid
    )
) else (
    echo [ERROR] Services API failed
)
echo.

REM Test 2: Get Kathmandu areas
echo 2. Testing GET /areas
curl -s "%BASE_URL%/areas" > temp_response.txt
if %ERRORLEVEL% EQU 0 (
    echo [OK] Areas API working
) else (
    echo [ERROR] Areas API failed
)
echo.

REM Test 3: Test chatbot
echo 3. Testing POST /chatbot
curl -s -X POST "%BASE_URL%/chatbot" -H "Content-Type: application/json" -d "{\"message\":\"I need a plumber\"}" > temp_response.txt
if %ERRORLEVEL% EQU 0 (
    echo [OK] Chatbot API working
) else (
    echo [ERROR] Chatbot API failed
)
echo.

REM Cleanup
del temp_response.txt 2>nul

echo.
echo API Testing Complete!
echo.
echo Next steps:
echo 1. If all tests passed, start frontend: cd project ^&^& npm run dev
echo 2. If tests failed, check backend logs and MongoDB connection
echo 3. Visit http://localhost:5173 to test the app
echo.
pause
