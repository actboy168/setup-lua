@ECHO OFF
for /f "usebackq tokens=*" %%i in (`"%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do (
   SET InstallDir=%%i
)
call "%InstallDir%\Common7\Tools\vsdevcmd.bat" -no_logo -arch=x64 -host_arch=x64

SETLOCAL ENABLEDELAYEDEXPANSION

SET CURDIR=%CD%
SET SOURCE=.\src\
SET CFLAG=
SET LUADLL=

CD %SOURCE%

SET OBJS=
for %%f in (*.c) do ( 
   SET FILENAME=%%~nf
   if not "!FILENAME!" == "lua" if not "!FILENAME!" == "luac" if not "!FILENAME!" == "print" (
      SET OBJS=!OBJS! !FILENAME!.obj
      SET COMPCMD=cl /nologo /MD /O2 /W3 /c /D_CRT_SECURE_NO_DEPRECATE /DLUA_BUILD_AS_DLL %CFLAG% !FILENAME!.c
      echo !COMPCMD!
      !COMPCMD!
   )
)

SET COMPCMD=cl /nologo /MD /O2 /W3 /c /D_CRT_SECURE_NO_DEPRECATE /DLUA_BUILD_AS_DLL %CFLAG% lua.c
echo !COMPCMD!
!COMPCMD!

SET LINKCMD=link /nologo /DLL /out:lua%LUADLL%.dll %OBJS%
echo !LINKCMD!
!LINKCMD!

SET LINKCMD=link /nologo /out:lua.exe lua.obj lua%LUADLL%.lib
echo !LINKCMD!
!LINKCMD!

echo.
echo Build completed.

CD %CURDIR%
exit /B 0
