package com.blueoauld.server.global.discord

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@ConditionalOnExpression("!'\${discord.token:}'.isEmpty()")
annotation class ConditionalOnDiscord
