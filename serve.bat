@echo off
setlocal
pushd "%~dp0docs"
python -m http.server 8080
popd
endlocal
