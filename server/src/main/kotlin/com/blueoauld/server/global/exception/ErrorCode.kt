package com.blueoauld.server.global.exception

import org.springframework.http.HttpStatus

enum class ErrorCode(

    val status: HttpStatus,
    val code: String,
    val message: String,
) {

    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "COMMON_001", "요청이 올바르지 않습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_999", "서버에 문제가 발생했습니다."),

    VERIFICATION_CODE_RESEND_TOO_SOON(
        HttpStatus.TOO_MANY_REQUESTS,
        "AUTH_001",
        "인증번호를 너무 자주 요청했습니다. 잠시 후 다시 시도해주시길 바랍니다.",
    ),
    VERIFICATION_CODE_SEND_LIMIT_EXCEEDED(
        HttpStatus.TOO_MANY_REQUESTS,
        "AUTH_002",
        "인증번호 요청 한도를 초과했습니다. 잠시 후 다시 시도해주시길 바랍니다.",
    ),
    VERIFICATION_CODE_IP_LIMIT_EXCEEDED(
        HttpStatus.TOO_MANY_REQUESTS,
        "AUTH_003",
        "인증번호 요청 한도를 초과했습니다. 잠시 후 다시 시도해주시길 바랍니다.",
    ),
}
