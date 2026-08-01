package com.blueoauld.server.global.response

data class CursorResponse<T>(

    val items: List<T>,
    val nextCursor: Long?,
)
