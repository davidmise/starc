@echo off
echo ===================================
echo STARS Corporate APK Builder
echo ===================================
echo.

echo Checking EAS CLI installation...
eas --version
if %ERRORLEVEL% neq 0 (
    echo Installing EAS CLI...
    npm install -g eas-cli
)

echo.
echo Current build profiles available:
echo 1. apk-test (recommended for testing)
echo 2. preview (internal preview)
echo 3. production (production build)
echo.

set /p profile="Enter build profile (1-3, default=1): "

if "%profile%"=="" set profile=1
if "%profile%"=="1" set buildProfile=apk-test
if "%profile%"=="2" set buildProfile=preview
if "%profile%"=="3" set buildProfile=production

echo.
echo Selected profile: %buildProfile%
echo.

echo Checking EAS authentication...
eas whoami
if %ERRORLEVEL% neq 0 (
    echo You need to login to EAS first.
    echo Please run: eas login
    echo Or create an account at: https://expo.dev/signup
    pause
    exit /b 1
)

echo.
echo Starting APK build with profile: %buildProfile%
echo This may take 10-20 minutes...
echo.

eas build --platform android --profile %buildProfile%

echo.
echo Build complete! Check the EAS dashboard for download link.
echo Or wait for the download prompt in the terminal.
echo.
pause