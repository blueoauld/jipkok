package com.blueoauld.server.domain.worry.dto.projection

import java.time.Instant

interface WorryCommentRow {

    fun getCommentId(): Long

    fun getMemberId(): Long

    fun getContent(): String

    fun getCreatedAt(): Instant

    fun getAnonymousNo(): Int

    fun getDeleted(): Boolean

    fun getDeletedByReport(): Boolean
}
