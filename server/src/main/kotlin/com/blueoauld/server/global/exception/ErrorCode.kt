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
    FORBIDDEN(HttpStatus.FORBIDDEN, "AUTH_014", "권한이 없습니다."),
    SMS_LOG_UNAVAILABLE(
        HttpStatus.SERVICE_UNAVAILABLE,
        "AUTH_015",
        "문자 발송 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주시길 바랍니다.",
    ),

    DUPLICATE_PHONE_NUMBER(HttpStatus.CONFLICT, "MEMBER_001", "이미 가입된 휴대폰 번호입니다."),
    PASSWORD_CONFIRM_MISMATCH(HttpStatus.BAD_REQUEST, "MEMBER_002", "비밀번호가 일치하지 않습니다."),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "MEMBER_003", "회원을 찾을 수 없습니다."),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "MEMBER_004", "이미 사용 중인 닉네임입니다."),
    INVALID_BIRTH_YEAR(HttpStatus.BAD_REQUEST, "MEMBER_005", "19세 이상 90세 이하만 가입할 수 있습니다."),
    INVALID_LOCATION(HttpStatus.BAD_REQUEST, "MEMBER_006", "위치 정보가 올바르지 않습니다."),
    SELF_MEMBER_DETAIL(HttpStatus.BAD_REQUEST, "MEMBER_009", "자기 자신은 조회할 수 없습니다."),
    INVALID_AGE_RANGE(HttpStatus.BAD_REQUEST, "MEMBER_010", "나이 범위가 올바르지 않습니다."),

    UNSUPPORTED_IMAGE_TYPE(HttpStatus.BAD_REQUEST, "PHOTO_001", "지원하지 않는 이미지 형식입니다."),
    INVALID_PHOTO_KEY(HttpStatus.BAD_REQUEST, "PHOTO_002", "사진 정보가 올바르지 않습니다."),
    PHOTO_TOO_LARGE(HttpStatus.BAD_REQUEST, "PHOTO_003", "사진이 너무 큽니다. 10MB까지 올릴 수 있습니다."),

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
    CONTACT_BLOCK_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "BLOCK_002", "차단할 수 있는 번호 수를 넘었습니다."),

    NOT_ENOUGH_POINT(HttpStatus.BAD_REQUEST, "POINT_001", "포인트가 부족합니다."),

    INVALID_AD_SIGNATURE(HttpStatus.UNAUTHORIZED, "AD_001", "광고 보상 서명이 올바르지 않습니다."),

    DUPLICATE_FEED_POST(HttpStatus.CONFLICT, "FEED_001", "이번 시간에는 이미 올렸습니다."),
    FEED_POST_NOT_FOUND(HttpStatus.NOT_FOUND, "FEED_002", "게시물을 찾을 수 없습니다."),
    DUPLICATE_FEED_POST_REPORT(HttpStatus.CONFLICT, "FEED_003", "이미 신고한 게시물입니다."),

    SELF_MEMO(HttpStatus.BAD_REQUEST, "MEMO_001", "자기 자신에게는 메모를 남길 수 없습니다."),

    SELF_NOTE(HttpStatus.BAD_REQUEST, "CHAT_001", "자기 자신에게는 쪽지를 보낼 수 없습니다."),
    NOTE_RECEIVE_DISABLED(HttpStatus.BAD_REQUEST, "CHAT_002", "상대가 쪽지를 받지 않습니다."),
    NOTE_BLOCKED(HttpStatus.BAD_REQUEST, "CHAT_003", "쪽지를 보낼 수 없습니다."),
    CHAT_ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "CHAT_004", "채팅방을 찾을 수 없습니다."),
    REPLY_TARGET_NOT_FOUND(HttpStatus.NOT_FOUND, "CHAT_005", "답글 대상 메시지를 찾을 수 없습니다."),
    CHAT_MESSAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "CHAT_006", "메시지를 찾을 수 없습니다."),
    VIDEO_TOO_LONG(HttpStatus.BAD_REQUEST, "CHAT_007", "동영상은 5분까지 보낼 수 있습니다."),
    VIDEO_TOO_LARGE(HttpStatus.BAD_REQUEST, "CHAT_008", "동영상이 너무 큽니다. 150MB까지 보낼 수 있습니다."),
    NOT_VIDEO_MESSAGE(HttpStatus.BAD_REQUEST, "CHAT_009", "동영상 메시지가 아닙니다."),
    PIN_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "CHAT_010", "채팅방은 5개까지 고정할 수 있습니다."),

    SELF_REPORT(HttpStatus.BAD_REQUEST, "REPORT_001", "자기 자신은 신고할 수 없습니다."),
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "REPORT_002", "신고를 찾을 수 없습니다."),

    WORRY_POST_NOT_FOUND(HttpStatus.NOT_FOUND, "WORRY_001", "글을 찾을 수 없습니다."),
    WORRY_DAILY_LIMIT(HttpStatus.CONFLICT, "WORRY_002", "고민은 하루에 5개까지 올릴 수 있습니다."),
    NOT_WORRY_POST_AUTHOR(HttpStatus.FORBIDDEN, "WORRY_003", "본인이 쓴 글만 지울 수 있습니다."),
    DUPLICATE_WORRY_POST_REPORT(HttpStatus.CONFLICT, "WORRY_004", "이미 신고한 글입니다."),
    WORRY_COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "WORRY_005", "댓글을 찾을 수 없습니다."),
    NOT_WORRY_COMMENT_AUTHOR(HttpStatus.FORBIDDEN, "WORRY_006", "본인이 쓴 댓글만 지울 수 있습니다."),
    DUPLICATE_WORRY_COMMENT_REPORT(HttpStatus.CONFLICT, "WORRY_007", "이미 신고한 댓글입니다."),
    NESTED_WORRY_REPLY(HttpStatus.BAD_REQUEST, "WORRY_008", "답글에는 답글을 달 수 없습니다."),

    DIARY_NOT_FOUND(HttpStatus.NOT_FOUND, "DIARY_001", "일기를 찾을 수 없습니다."),
    FUTURE_DIARY_DATE(HttpStatus.BAD_REQUEST, "DIARY_002", "아직 오지 않은 날의 일기는 쓸 수 없습니다."),
    EMPTY_DIARY(HttpStatus.BAD_REQUEST, "DIARY_003", "내용이나 사진을 넣어주시길 바랍니다."),
    BEFORE_SIGNUP_DIARY_DATE(HttpStatus.BAD_REQUEST, "DIARY_004", "가입하기 전 날의 일기는 쓸 수 없습니다."),

    TRANSLATE_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "TRANSLATION_001", "번역하지 못했습니다. 잠시 후 다시 시도해주시길 바랍니다."),
    TRANSLATE_LIMIT_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "TRANSLATION_002", "번역 요청 한도를 초과했습니다. 잠시 후 다시 시도해주시길 바랍니다."),

    APPLE_ADS_NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE, "APPLE_ADS_001", "애플 광고 API가 설정되어 있지 않습니다."),
    APPLE_ADS_UNAVAILABLE(
        HttpStatus.SERVICE_UNAVAILABLE,
        "APPLE_ADS_002",
        "애플 광고 API에 연결하지 못했습니다. 잠시 후 다시 시도해주시길 바랍니다.",
    ),
    INVALID_APPLE_ADS_REPORT_RANGE(
        HttpStatus.BAD_REQUEST,
        "APPLE_ADS_003",
        "리포트 기간은 90일까지이고, 시작일은 오늘부터 90일 전까지여야 합니다.",
    ),
    APPLE_ADS_ACTION_NOT_FOUND(HttpStatus.NOT_FOUND, "APPLE_ADS_004", "애플 광고 조치를 찾을 수 없습니다."),
    APPLE_ADS_ACTION_ALREADY_REVERTED(HttpStatus.CONFLICT, "APPLE_ADS_005", "이미 되돌린 조치입니다."),
    APPLE_ADS_KEYWORD_CHANGED(
        HttpStatus.CONFLICT,
        "APPLE_ADS_006",
        "애플 광고에서 키워드가 바뀌었습니다. 리포트를 동기화한 뒤 다시 시도해주시길 바랍니다.",
    ),
    AI_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "AI_001", "AI 계정을 찾을 수 없습니다."),
    INVALID_REPLY_DELAY(HttpStatus.BAD_REQUEST, "AI_002", "응답 지연은 최소값이 최대값보다 클 수 없습니다."),
    AI_REPLY_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "AI_003", "OpenAI 키가 없어 AI 응답을 만들 수 없습니다."),

    APPLE_ADS_ACTION_SUPERSEDED(
        HttpStatus.CONFLICT,
        "APPLE_ADS_007",
        "같은 대상에 더 나중에 한 조치가 있습니다. 나중 조치부터 되돌려주시길 바랍니다.",
    ),
}
