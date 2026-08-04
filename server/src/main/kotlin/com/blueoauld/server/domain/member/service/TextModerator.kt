package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.type.ModerationCategory

data class ModerationResult(

    val inappropriate: Boolean,
    val category: ModerationCategory,
) {

    companion object {

        val PASSED = ModerationResult(false, ModerationCategory.NONE)
    }
}

fun interface TextModerator {

    fun moderate(text: String): ModerationResult
}
