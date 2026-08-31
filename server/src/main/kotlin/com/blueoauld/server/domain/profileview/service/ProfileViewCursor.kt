package com.blueoauld.server.domain.profileview.service

import java.time.Instant

object ProfileViewCursor {

    private const val SEPARATOR = ":"

    fun encode(viewedAt: Instant, id: Long) = "${viewedAt.toEpochMilli()}$SEPARATOR$id"

    fun decode(cursor: String?): Pair<Instant, Long>? {
        val (viewedAt, id) = cursor?.split(SEPARATOR)?.takeIf { it.size == 2 } ?: return null

        return Instant.ofEpochMilli(viewedAt.toLongOrNull() ?: return null) to (id.toLongOrNull() ?: return null)
    }
}
