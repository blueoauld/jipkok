package com.blueoauld.server.domain.ai.repository

import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

interface AiPersonaRepository : JpaRepository<AiPersona, Long> {

    fun findAllByEnabledTrueAndNextLocationRefreshAtLessThanEqual(threshold: Instant): List<AiPersona>
}

fun AiPersonaRepository.getPersona(memberId: Long): AiPersona = findById(memberId).orElseThrow {
    BusinessException(ErrorCode.AI_MEMBER_NOT_FOUND)
}
