package com.blueoauld.server.domain.report.entity.type

enum class ReportReason(

    val label: String,
) {

    OBSCENITY("음란물"),
    MINOR("미성년자"),
    MONEY_TRANSACTION("금전거래"),
    ABUSE("욕설 및 협박"),
    IMPERSONATION("사칭 및 도용"),
    ETC("기타"),
}
