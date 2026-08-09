package com.blueoauld.server.global.response

import java.time.Instant

data class ScrollResponse<T>(

    val items: List<T>,
    val nextCursor: String?,
) {

    companion object {

        private const val SEPARATOR = ":"

        fun encode(orderValue: Double, memberId: Long) = "$orderValue$SEPARATOR$memberId"

        fun decode(cursor: String?): Pair<Double, Long>? {
            val (orderValue, memberId) = split(cursor, 2) ?: return null

            return (orderValue.toDoubleOrNull() ?: return null) to (memberId.toLongOrNull() ?: return null)
        }

        fun encodeRanking(likeCount: Int, locatedAt: Long, memberId: Long) =
            listOf(likeCount, locatedAt, memberId).joinToString(SEPARATOR)

        fun decodeRanking(cursor: String?): Triple<Long, Long, Long>? {
            val (likeCount, locatedAt, memberId) = split(cursor, 3) ?: return null

            return Triple(
                likeCount.toLongOrNull() ?: return null,
                locatedAt.toLongOrNull() ?: return null,
                memberId.toLongOrNull() ?: return null,
            )
        }

        fun encodeProfileView(viewedAt: Instant, id: Long) = "${viewedAt.toEpochMilli()}$SEPARATOR$id"

        fun decodeProfileView(cursor: String?): Pair<Instant, Long>? {
            val (viewedAt, id) = split(cursor, 2) ?: return null

            return Instant.ofEpochMilli(viewedAt.toLongOrNull() ?: return null) to (id.toLongOrNull() ?: return null)
        }

        private fun split(cursor: String?, count: Int) = cursor?.split(SEPARATOR)?.takeIf { it.size == count }
    }
}
