package com.blueoauld.server.domain.suspension.entity.type

enum class SuspensionType(

    val label: String,
) {

    SECRET_PHOTO("비밀 사진"),
    PROFILE_EDIT("프로필 수정"),
    SERVICE("서비스 이용"),
}
