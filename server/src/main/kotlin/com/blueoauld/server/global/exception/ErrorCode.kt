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
    VERIFICATION_CODE_NOT_FOUND(HttpStatus.BAD_REQUEST, "AUTH_004", "인증번호가 올바르지 않습니다."),
    VERIFICATION_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "AUTH_005", "인증번호가 만료되었습니다. 다시 요청해주시길 바랍니다."),
    VERIFICATION_CODE_MISMATCH(HttpStatus.BAD_REQUEST, "AUTH_006", "인증번호가 올바르지 않습니다."),
    VERIFICATION_CODE_ATTEMPT_EXCEEDED(
        HttpStatus.TOO_MANY_REQUESTS,
        "AUTH_007",
        "인증번호 입력 횟수를 초과했습니다. 인증번호를 다시 요청해주시길 바랍니다.",
    ),

    LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "AUTH_008", "휴대폰 번호 또는 비밀번호가 올바르지 않습니다."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_009", "다시 로그인해주시길 바랍니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH_010", "로그인이 필요합니다."),

    DUPLICATE_PHONE_NUMBER(HttpStatus.CONFLICT, "MEMBER_001", "이미 가입된 휴대폰 번호입니다."),
    PASSWORD_CONFIRM_MISMATCH(HttpStatus.BAD_REQUEST, "MEMBER_002", "비밀번호가 일치하지 않습니다."),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "MEMBER_003", "회원을 찾을 수 없습니다."),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "MEMBER_004", "이미 사용 중인 닉네임입니다."),
    INVALID_BIRTH_YEAR(HttpStatus.BAD_REQUEST, "MEMBER_005", "만 19세 이상 90세 이하만 가입할 수 있습니다."),
    INVALID_LOCATION(HttpStatus.BAD_REQUEST, "MEMBER_006", "위치 정보가 올바르지 않습니다."),
}
