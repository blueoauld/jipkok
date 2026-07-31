package com.blueoauld.server.domain.auth.service

fun interface VerificationCodeSender {

    fun send(phoneNumber: String, code: String)
}
