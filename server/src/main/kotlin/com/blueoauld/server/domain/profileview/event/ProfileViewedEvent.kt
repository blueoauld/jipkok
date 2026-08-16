package com.blueoauld.server.domain.profileview.event

data class ProfileViewedEvent(

    val viewerId: Long,
    val viewedMemberId: Long,
)
