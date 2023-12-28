@echo off
rem Delete existing WebP files
del *.webp

rem Convert JPEG and PNG to WebP with maximum quality
for %%i in (*.png) do (
    cwebp "%%i" -q 100 -o "%%~ni.webp"
)