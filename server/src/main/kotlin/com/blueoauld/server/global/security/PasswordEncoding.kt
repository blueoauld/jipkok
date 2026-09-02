package com.blueoauld.server.global.security

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.security.crypto.password.PasswordEncoder

fun PasswordEncoder.encodePassword(rawPassword: String): String = checkNotNull(encode(rawPassword)) {
    "비밀번호를 암호화하지 못했다."
}

fun checkPasswordConfirm(password: String, passwordConfirm: String) {
    if (password != passwordConfirm) {
        throw BusinessException(ErrorCode.PASSWORD_CONFIRM_MISMATCH)
    }
}
