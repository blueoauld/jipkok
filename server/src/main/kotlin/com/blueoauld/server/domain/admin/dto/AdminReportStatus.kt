package com.blueoauld.server.domain.admin.dto

enum class AdminReportStatus(

    val handled: Boolean?,
) {

    ALL(null),
    PENDING(false),
    HANDLED(true),
}
