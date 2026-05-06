@echo off
cd /d c:\osvaldo\polla-mundialista
call npx -y @angular/cli@17 new frontend --standalone --routing --style=scss --skip-tests --skip-git --ssr=false
echo DONE
