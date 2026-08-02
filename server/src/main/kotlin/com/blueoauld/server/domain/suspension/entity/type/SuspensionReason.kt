package com.blueoauld.server.domain.suspension.entity.type

enum class SuspensionReason(

    val label: String,
) {

    SCREEN_CAPTURE("비밀 사진 캡처"),
    OBSCENITY("음란물"),
    MINOR("미성년자"),
    MONEY_TRANSACTION("금전거래"),
    ABUSE("욕설 및 협박"),
    IMPERSONATION("사칭 및 도용"),
    ETC("기타"),
}
