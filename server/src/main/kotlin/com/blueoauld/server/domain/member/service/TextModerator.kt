package com.blueoauld.server.domain.member.service

fun interface TextModerator {

    fun isInappropriate(text: String): Boolean
}
