package com.blueoauld.server.domain.admin.service

object AdminPaging {

    const val MAX_PAGE = 100_000
    const val MAX_SIZE = 100

    fun page(page: Int) = page.coerceIn(1, MAX_PAGE)

    fun size(size: Int) = size.coerceIn(1, MAX_SIZE)

    fun offset(page: Int, size: Int) = (page - 1) * size
}
