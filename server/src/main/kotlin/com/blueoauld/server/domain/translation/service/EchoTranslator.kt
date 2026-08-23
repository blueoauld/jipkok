package com.blueoauld.server.domain.translation.service

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
@Profile("!prod")
@ConditionalOnExpression("'\${google-translate.api-key:}'.isEmpty()")
class EchoTranslator : Translator {

    override fun translate(text: String, targetLocale: MemberLocale): String {
        log.info { "번역을 건너뛴다. targetLocale=$targetLocale" }

        return text
    }
}
