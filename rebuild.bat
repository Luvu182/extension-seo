@echo off
echo Building Extension...
npm run build
echo.

echo Cleaning up dist/js/lib folder...
echo Removing unnecessary files...
if exist "dist\js\lib\web-vitals.iife.js" del /f /q "dist\js\lib\web-vitals.iife.js"
if exist "dist\js\lib\web-vitals-handler.js" del /f /q "dist\js\lib\web-vitals-handler.js"

echo Copying direct-web-vitals.js to dist folder...
copy "js\lib\direct-web-vitals.js" "dist\js\lib\" /Y

echo.
echo Testing manifest file consistency...
fc "manifest.json" "dist\manifest.json" > nul
if errorlevel 1 (
  echo Updating manifest.json in dist folder...
  copy "manifest.json" "dist\manifest.json" /Y
) else (
  echo Manifest files are identical. No update needed.
)

echo.
echo Build complete!
echo.
echo Remember to refresh the extension in Chrome after building.
