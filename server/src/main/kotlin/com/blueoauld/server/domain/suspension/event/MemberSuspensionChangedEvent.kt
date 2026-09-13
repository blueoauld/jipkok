package com.blueoauld.server.domain.suspension.event

data class MemberSuspensionChangedEvent(

    val memberIds: Set<Long>,
)
