package com.blueoauld.server.domain.member.entity.type

enum class MemberView(

    val label: String,
) {

    PROFILE("프로필"),
    PUBLIC_PHOTO("공개 사진"),
    SECRET_PHOTO("비밀 사진"),
}
