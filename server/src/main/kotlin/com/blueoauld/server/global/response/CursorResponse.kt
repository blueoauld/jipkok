package com.blueoauld.server.global.response

data class CursorResponse<T>(

    val items: List<T>,
    val nextCursor: Long?,
) {

    companion object {

        const val MAX_PAGE_SIZE = 50

        fun pageSize(size: Int) = size.coerceIn(1, MAX_PAGE_SIZE)
    }
}
