; Enable checkbox on license page instead of "I Agree" button
!define MUI_LICENSEPAGE_CHECKBOX

!macro customInstall
  CreateShortCut "$DESKTOP\5TactiQ.lnk" "$INSTDIR\5TactiQ.exe"
  CreateDirectory "$SMPROGRAMS\5TactiQ"
  CreateShortCut "$SMPROGRAMS\5TactiQ\5TactiQ.lnk" "$INSTDIR\5TactiQ.exe"
!macroend
