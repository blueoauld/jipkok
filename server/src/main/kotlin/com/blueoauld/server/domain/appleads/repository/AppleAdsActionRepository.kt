package com.blueoauld.server.domain.appleads.repository

import com.blueoauld.server.domain.appleads.entity.AppleAdsAction
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface AppleAdsActionRepository : JpaRepository<AppleAdsAction, Long> {

    fun findAllByOrderByIdDesc(pageable: Pageable): Page<AppleAdsAction>

    fun findAllByCreatedAtAfterOrRevertedAtAfter(createdAfter: Instant, revertedAfter: Instant): List<AppleAdsAction>

    fun findAllByTypeInAndRevertedAtIsNull(types: Collection<AppleAdsActionType>): List<AppleAdsAction>

    fun existsByIdGreaterThanAndKeywordIdAndRevertedAtIsNull(id: Long, keywordId: Long): Boolean

    fun existsByIdGreaterThanAndAdGroupIdAndSearchTermAndRevertedAtIsNull(
        id: Long,
        adGroupId: Long,
        searchTerm: String,
    ): Boolean

    fun countByAutomaticTrueAndCreatedAtAfter(threshold: Instant): Long
}
