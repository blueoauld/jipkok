package com.blueoauld.server.domain.appleads.repository

import com.blueoauld.server.domain.appleads.entity.AppleAdsAction
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface AppleAdsActionRepository : JpaRepository<AppleAdsAction, Long> {

    fun findAllByOrderByIdDesc(pageable: Pageable): Page<AppleAdsAction>

    fun findAllByCreatedAtAfterAndRevertedAtIsNull(threshold: Instant): List<AppleAdsAction>

    fun countByAutomaticTrueAndCreatedAtAfter(threshold: Instant): Long
}
