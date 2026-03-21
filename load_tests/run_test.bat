@echo off
chcp 65001 >nul

REM Script to compile and run the CrackHash load test
REM Usage: run_test.bat [client_count] [URL]
REM Example: run_test.bat 1000
REM Default: 1000 clients, http://localhost:8082/api/hash/crack

set CLIENTS=%1
if "%CLIENTS%"=="" set CLIENTS=1000

set URL=%2
if "%URL%"=="" set URL=http://localhost:8082/api/hash/crack

echo === Compiling load test ===
if not exist out mkdir out
javac -encoding UTF-8 -d out src\main\java\ru\nsu\prokofiev\crackhash\loadtest\LoadTest.java

if %ERRORLEVEL% NEQ 0 (
    echo Compilation failed!
    exit /b 1
)

echo === Running test: %CLIENTS% clients ===
echo.
java -cp out ru.nsu.prokofiev.crackhash.loadtest.LoadTest %CLIENTS% %URL%
