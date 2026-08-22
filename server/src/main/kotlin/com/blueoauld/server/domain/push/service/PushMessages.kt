package com.blueoauld.server.domain.push.service

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import org.springframework.context.MessageSource
import org.springframework.stereotype.Component

@Component
class PushMessages(

    private val messageSource: MessageSource,
) {

    fun get(locale: MemberLocale, code: String): String = messageSource.getMessage(code, null, locale.javaLocale)
}
