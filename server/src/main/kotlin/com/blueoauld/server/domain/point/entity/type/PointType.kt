package com.blueoauld.server.domain.point.entity.type

enum class PointType(

    val amount: Int,
) {

    ACCESS_REWARD(30),
    ATTENDANCE_REWARD(30),
    AD_REWARD(30),
    NOTE_SEND(-15),
}
