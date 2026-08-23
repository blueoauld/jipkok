package com.blueoauld.server.domain.translation.repository

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.translation.entity.Translation
import com.blueoauld.server.domain.translation.entity.type.TranslationSource
import org.springframework.data.jpa.repository.JpaRepository

interface TranslationRepository : JpaRepository<Translation, Long> {

    fun findBySourceTypeAndSourceIdAndTargetLocale(
        sourceType: TranslationSource,
        sourceId: Long,
        targetLocale: MemberLocale,
    ): Translation?

    fun deleteAllBySourceTypeAndSourceIdIn(sourceType: TranslationSource, sourceIds: List<Long>)
}
