package com.blueoauld.server.domain.feed.dto.projection

import com.blueoauld.server.domain.member.entity.type.MemberLocale

interface FeedReminderTarget {

    fun getMemberId(): Long

    fun getLocale(): MemberLocale
}
