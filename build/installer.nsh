; Enable checkbox on license page
!define MUI_LICENSEPAGE_CHECKBOX

; Multi-language license files
!macro customInit
  ; Nothing needed here
!macroend

LicenseLangString MUILicense ${LANG_VIETNAMESE} "public\license.txt"
LicenseLangString MUILicense ${LANG_ENGLISH} "public\license_en.txt"
LicenseLangString MUILicense ${LANG_SPANISH} "public\license_es.txt"
LicenseLangString MUILicense ${LANG_PORTUGUESEBR} "public\license_pt.txt"
LicenseLangString MUILicense ${LANG_ARABIC} "public\license_ar.txt"
LicenseLangString MUILicense ${LANG_RUSSIAN} "public\license_ru.txt"
