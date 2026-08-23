package com.blueoauld.server.domain.translation.dto.request

import com.blueoauld.server.domain.translation.entity.type.TranslationSource

data class TranslateRequest(

    val sourceType: TranslationSource,

    val sourceId: Long,
)
