package com.blueoauld.server.domain.admin.dto.response

data class DashboardSummaryResponse(

    val pendingMemberReports: Long,
    val suspendedMembers: Long,
    val todaySignups: Long,
    val todayWithdrawals: Long,
)
