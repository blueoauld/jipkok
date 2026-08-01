package com.blueoauld.server.global.response

data class ScrollResponse<T>(

    val items: List<T>,
    val nextCursor: String?,
) {

    companion object {

        private const val SEPARATOR = ":"

        fun encode(orderValue: Double, memberId: Long) = "$orderValue$SEPARATOR$memberId"

        fun decode(cursor: String?): Pair<Double, Long>? {
            val (orderValue, memberId) = cursor?.split(SEPARATOR)?.takeIf { it.size == 2 } ?: return null

            return (orderValue.toDoubleOrNull() ?: return null) to (memberId.toLongOrNull() ?: return null)
        }
    }
}
