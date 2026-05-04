@echo off
setlocal

set "NODE_ROOT=%~dp0..\tools\node"
if not exist "%NODE_ROOT%\npm.cmd" (
  echo Local Node runtime not found at "%NODE_ROOT%".
  echo Re-run the project setup or restore the tools folder.
  exit /b 1
)

set "PATH=%NODE_ROOT%;%PATH%"
call "%NODE_ROOT%\npm.cmd" run dev -- %*
