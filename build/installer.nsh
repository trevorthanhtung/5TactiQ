; Enable checkbox on license page instead of "I Agree" button
!define MUI_LICENSEPAGE_CHECKBOX

!macro customHeader
  !define MUI_FINISHPAGE_SHOWREADME
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Tạo bieu tuong ngoai Desktop va Start Menu"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION CreateShortcutsFunction
!macroend

Function CreateShortcutsFunction
  CreateShortCut "$DESKTOP\5TactiQ.lnk" "$INSTDIR\5TactiQ.exe"
  CreateDirectory "$SMPROGRAMS\5TactiQ"
  CreateShortCut "$SMPROGRAMS\5TactiQ\5TactiQ.lnk" "$INSTDIR\5TactiQ.exe"
FunctionEnd
