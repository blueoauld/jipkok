package com.blueoauld.server.domain.admin.dto.projection

import java.time.Instant

interface AdminChatRoomRow {

    val id: Long
    val lowMemberId: Long
    val highMemberId: Long
    val lastMessageId: Long
    val createdAt: Instant
    val deletedAt: Instant?
}
