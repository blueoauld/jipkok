package com.blueoauld.server.domain.member.entity.type

enum class ProfileTarget(

    val label: String,
) {

    NICKNAME("닉네임"),
    COMMENT("코멘트"),
    BIO("자기소개"),
    PUBLIC_PHOTO("공개 사진"),
    SECRET_PHOTO("비밀 사진"),
}
