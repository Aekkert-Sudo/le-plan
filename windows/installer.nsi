Unicode true
SetCompressor /SOLID lzma
!include "MUI2.nsh"
!define APP "L & E Plan"
!define EXE "L & E Plan.exe"
!define UNKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\LEPlan"
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
Name "${APP}"
OutFile "dist\L-und-E-Plan-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\L und E Plan"
RequestExecutionLevel user
BrandingText "${APP} ${VERSION}"
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${APP}"
VIAddVersionKey "FileDescription" "${APP} Installation"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "L & E"
VIAddVersionKey "LegalCopyright" "L & E"
!define MUI_ICON "build\icon.ico"
!define MUI_UNICON "build\icon.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "${APP} jetzt starten"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "German"

Section "Install"
  nsExec::Exec 'taskkill /F /IM "${EXE}"'
  Sleep 500
  RMDir /r "$INSTDIR"
  SetOutPath "$INSTDIR"
  File /r "dist\win-unpacked\*.*"
  File "build\icon.ico"
  WriteUninstaller "$INSTDIR\Deinstallieren.exe"
  CreateShortcut "$DESKTOP\${APP}.lnk" "$INSTDIR\${EXE}" "" "$INSTDIR\icon.ico"
  CreateShortcut "$SMPROGRAMS\${APP}.lnk" "$INSTDIR\${EXE}" "" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "${UNKEY}" "DisplayName" "${APP}"
  WriteRegStr HKCU "${UNKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNKEY}" "Publisher" "L & E"
  WriteRegStr HKCU "${UNKEY}" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "${UNKEY}" "UninstallString" '"$INSTDIR\Deinstallieren.exe"'
  WriteRegDWORD HKCU "${UNKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNKEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM "${EXE}"'
  Sleep 500
  Delete "$DESKTOP\${APP}.lnk"
  Delete "$SMPROGRAMS\${APP}.lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "${UNKEY}"
  ; Pläne (im Benutzerordner) bleiben absichtlich erhalten
SectionEnd
