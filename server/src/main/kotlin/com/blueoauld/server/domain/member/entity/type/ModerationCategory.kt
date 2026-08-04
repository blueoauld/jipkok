package com.blueoauld.server.domain.member.entity.type

enum class ModerationCategory(

    val label: String,
) {

    SEXUAL("성적인 내용"),
    ABUSE("욕설 및 혐오"),
    CONTACT("연락처 노출"),
    ADVERTISEMENT("광고 및 홍보"),
    NONE("해당 없음"),
}
