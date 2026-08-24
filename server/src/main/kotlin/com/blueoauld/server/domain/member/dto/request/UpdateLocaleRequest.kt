package com.blueoauld.server.domain.member.dto.request

import com.blueoauld.server.domain.member.entity.type.MemberLocale

data class UpdateLocaleRequest(

    val locale: MemberLocale,
)
