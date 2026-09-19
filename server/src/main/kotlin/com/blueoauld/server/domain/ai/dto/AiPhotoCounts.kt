package com.blueoauld.server.domain.ai.dto

import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility

data class AiPhotoCounts(

    val publicCount: Int,
    val secretCount: Int,
) {

    companion object {

        val NONE = AiPhotoCounts(publicCount = 0, secretCount = 0)

        fun of(photos: List<MemberPhoto>) = AiPhotoCounts(
            publicCount = photos.count { it.visibility == PhotoVisibility.PUBLIC },
            secretCount = photos.count { it.visibility == PhotoVisibility.SECRET },
        )
    }
}
