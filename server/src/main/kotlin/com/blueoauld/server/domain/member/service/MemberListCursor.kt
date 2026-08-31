package com.blueoauld.server.domain.member.service

object MemberListCursor {

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

    private fun split(cursor: String?, count: Int) = cursor?.split(SEPARATOR)?.takeIf { it.size == count }
}
