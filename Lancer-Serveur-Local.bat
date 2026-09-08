@echo off
cd /d "%~dp0"
echo Serveur local sur http://127.0.0.1:8777 - fermez cette fenetre pour arreter.
start "" http://127.0.0.1:8777
py -m http.server 8777 --bind 127.0.0.1 2>/dev/null || python -m http.server 8777 --bind 127.0.0.1
