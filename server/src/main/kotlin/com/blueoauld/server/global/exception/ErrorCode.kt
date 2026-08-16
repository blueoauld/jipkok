package com.blueoauld.server.global.exception

import org.springframework.http.HttpStatus

enum class ErrorCode(

    val status: HttpStatus,
    val code: String,
    val message: String,
) {

    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "COMMON_001", "요청이 올바르지 않습니다."),
    DUPLICATE_REQUEST(HttpStatus.CONFLICT, "COMMON_002", "요청이 중복되었습니다."),
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
    VERIFICATION_CODE_SEND_FAILED(
        HttpStatus.SERVICE_UNAVAILABLE,
        "AUTH_011",
        "인증번호를 보내지 못했습니다. 잠시 후 다시 시도해주시길 바랍니다.",
    ),
    LOGIN_ATTEMPT_EXCEEDED(
        HttpStatus.TOO_MANY_REQUESTS,
        "AUTH_012",
        "로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주시길 바랍니다.",
    ),
    VERIFICATION_CODE_ALREADY_USED(
        HttpStatus.BAD_REQUEST,
        "AUTH_013",
        "이미 사용한 인증번호입니다. 다시 요청해주시길 바랍니다.",
    ),

    DUPLICATE_PHONE_NUMBER(HttpStatus.CONFLICT, "MEMBER_001", "이미 가입된 휴대폰 번호입니다."),
    PASSWORD_CONFIRM_MISMATCH(HttpStatus.BAD_REQUEST, "MEMBER_002", "비밀번호가 일치하지 않습니다."),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "MEMBER_003", "회원을 찾을 수 없습니다."),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "MEMBER_004", "이미 사용 중인 닉네임입니다."),
    INVALID_BIRTH_YEAR(HttpStatus.BAD_REQUEST, "MEMBER_005", "19세 이상 90세 이하만 가입할 수 있습니다."),
    INVALID_LOCATION(HttpStatus.BAD_REQUEST, "MEMBER_006", "위치 정보가 올바르지 않습니다."),
    UNSUPPORTED_IMAGE_TYPE(HttpStatus.BAD_REQUEST, "MEMBER_007", "지원하지 않는 이미지 형식입니다."),
    INVALID_PHOTO_KEY(HttpStatus.BAD_REQUEST, "MEMBER_008", "사진 정보가 올바르지 않습니다."),
    SELF_MEMBER_DETAIL(HttpStatus.BAD_REQUEST, "MEMBER_009", "자기 자신은 조회할 수 없습니다."),

    SELF_LIKE(HttpStatus.BAD_REQUEST, "LIKE_001", "자기 자신에게는 좋아요를 누를 수 없습니다."),

    SELF_FAVORITE(HttpStatus.BAD_REQUEST, "FAVORITE_001", "자기 자신은 즐겨찾기할 수 없습니다."),

    SELF_SECRET_PHOTO_ACCESS(
        HttpStatus.BAD_REQUEST,
        "SECRET_PHOTO_001",
        "자기 자신에게는 비밀 사진을 공개할 수 없습니다.",
    ),

    SECRET_PHOTO_FORBIDDEN(HttpStatus.FORBIDDEN, "SECRET_PHOTO_002", "비밀 사진을 볼 수 없습니다."),

    SECRET_PHOTO_SUSPENDED(HttpStatus.FORBIDDEN, "SUSPENSION_001", "비밀 사진 이용이 정지되었습니다."),
    PROFILE_EDIT_SUSPENDED(HttpStatus.FORBIDDEN, "SUSPENSION_002", "프로필 수정이 정지되었습니다."),
    SERVICE_SUSPENDED(HttpStatus.FORBIDDEN, "SUSPENSION_003", "서비스 이용이 정지되었습니다."),
    SUSPENSION_NOT_FOUND(HttpStatus.NOT_FOUND, "SUSPENSION_004", "정지를 찾을 수 없습니다."),
    DUPLICATE_SUSPENSION(HttpStatus.CONFLICT, "SUSPENSION_005", "이미 정지 중입니다. 해제 후 다시 걸어주시길 바랍니다."),

    SELF_BLOCK(HttpStatus.BAD_REQUEST, "BLOCK_001", "자기 자신은 차단할 수 없습니다."),

    NOT_ENOUGH_POINT(HttpStatus.BAD_REQUEST, "POINT_001", "포인트가 부족합니다."),

    INVALID_AD_SIGNATURE(HttpStatus.UNAUTHORIZED, "AD_001", "광고 보상 서명이 올바르지 않습니다."),

    DUPLICATE_FEED_POST(HttpStatus.CONFLICT, "FEED_001", "이번 시간에는 이미 올렸습니다."),
    FEED_POST_NOT_FOUND(HttpStatus.NOT_FOUND, "FEED_002", "게시물을 찾을 수 없습니다."),
    DUPLICATE_FEED_POST_REPORT(HttpStatus.CONFLICT, "FEED_003", "이미 신고한 게시물입니다."),

    SELF_NOTE(HttpStatus.BAD_REQUEST, "CHAT_001", "자기 자신에게는 쪽지를 보낼 수 없습니다."),
    NOTE_RECEIVE_DISABLED(HttpStatus.BAD_REQUEST, "CHAT_002", "상대가 쪽지를 받지 않습니다."),
    NOTE_BLOCKED(HttpStatus.BAD_REQUEST, "CHAT_003", "쪽지를 보낼 수 없습니다."),
    CHAT_ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "CHAT_004", "채팅방을 찾을 수 없습니다."),
    REPLY_TARGET_NOT_FOUND(HttpStatus.NOT_FOUND, "CHAT_005", "답글 대상 메시지를 찾을 수 없습니다."),

    SELF_REPORT(HttpStatus.BAD_REQUEST, "REPORT_001", "자기 자신은 신고할 수 없습니다."),
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "REPORT_002", "신고를 찾을 수 없습니다."),
}
