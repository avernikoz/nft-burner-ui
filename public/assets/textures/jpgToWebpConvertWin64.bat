@echo off
rem Delete existing WebP files
del *.webp

rem Convert JPEG and PNG to WebP with maximum quality
for %%i in (*.jpg) do (
    cwebp "%%i" -q 100 -o "%%~ni.webp"
)