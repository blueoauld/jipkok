package com.blueoauld.server.domain.point.entity.type

enum class PointType(

    val amount: Int,
    val dailyLimit: Int?,
) {

    ACCESS_REWARD(30, 1),
    ATTENDANCE_REWARD(30, 1),
    AD_REWARD(30, 5),
    NOTE_SEND(-15, null),
}
