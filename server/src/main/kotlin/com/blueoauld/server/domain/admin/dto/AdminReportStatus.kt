package com.blueoauld.server.domain.admin.dto

enum class AdminReportStatus(

    val handled: Boolean,
) {

    PENDING(false),
    HANDLED(true),
}
