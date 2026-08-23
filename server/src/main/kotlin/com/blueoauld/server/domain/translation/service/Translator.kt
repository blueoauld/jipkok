package com.blueoauld.server.domain.translation.service

import com.blueoauld.server.domain.member.entity.type.MemberLocale

fun interface Translator {

    fun translate(text: String, targetLocale: MemberLocale): String
}
