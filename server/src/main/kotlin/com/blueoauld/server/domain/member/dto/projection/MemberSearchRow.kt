package com.blueoauld.server.domain.member.dto.projection

interface MemberSearchRow {

    fun getMemberId(): Long

    fun getOrderValue(): Double
}
