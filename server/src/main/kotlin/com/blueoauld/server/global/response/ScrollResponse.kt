package com.blueoauld.server.global.response

data class ScrollResponse<T>(

    val items: List<T>,
    val nextCursor: String?,
)
