package com.blueoauld.server.domain.member.dto.projection

import java.time.Instant

interface MemberListRow {

    fun getMemberId(): Long

    fun getOrderValue(): Double

    fun getLocatedAt(): Instant?

    fun getDistance(): Double?
}
