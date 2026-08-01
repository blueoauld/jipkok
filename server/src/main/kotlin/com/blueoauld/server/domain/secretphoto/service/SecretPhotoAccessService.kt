package com.blueoauld.server.domain.secretphoto.service

import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.domain.secretphoto.entity.SecretPhotoAccess
import com.blueoauld.server.domain.secretphoto.repository.SecretPhotoAccessRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SecretPhotoAccessService(

    private val secretPhotoAccessRepository: SecretPhotoAccessRepository,
    private val memberRepository: MemberRepository,
    private val memberSummaryService: MemberSummaryService,
) {

    @Transactional
    fun grant(ownerId: Long, viewerId: Long) {
        if (ownerId == viewerId) {
            throw BusinessException(ErrorCode.SELF_SECRET_PHOTO_ACCESS)
        }

        if (!memberRepository.existsById(viewerId)) {
            throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        if (secretPhotoAccessRepository.existsByOwnerIdAndViewerId(ownerId, viewerId)) {
            return
        }

        runCatching { secretPhotoAccessRepository.saveAndFlush(SecretPhotoAccess(ownerId, viewerId)) }
            .onFailure { if (it !is DataIntegrityViolationException) throw it }
    }

    @Transactional
    fun revoke(ownerId: Long, viewerId: Long) {
        secretPhotoAccessRepository.deleteByOwnerIdAndViewerId(ownerId, viewerId)
    }

    @Transactional(readOnly = true)
    fun findGranted(ownerId: Long, cursor: Long?, size: Int): CursorResponse<MemberSummaryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val accesses = secretPhotoAccessRepository.findByOwnerIdAndIdLessThanOrderByIdDesc(
            ownerId,
            cursor ?: Long.MAX_VALUE,
            Limit.of(pageSize),
        )

        return toResponse(accesses, pageSize) { it.viewerId }
    }

    @Transactional(readOnly = true)
    fun findReceived(viewerId: Long, cursor: Long?, size: Int): CursorResponse<MemberSummaryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val accesses = secretPhotoAccessRepository.findByViewerIdAndIdLessThanOrderByIdDesc(
            viewerId,
            cursor ?: Long.MAX_VALUE,
            Limit.of(pageSize),
        )

        return toResponse(accesses, pageSize) { it.ownerId }
    }

    private fun toResponse(
        accesses: List<SecretPhotoAccess>,
        pageSize: Int,
        toMemberId: (SecretPhotoAccess) -> Long,
    ) = CursorResponse(
        items = memberSummaryService.findSummaries(accesses.map(toMemberId)),
        nextCursor = accesses.lastOrNull()?.id.takeIf { accesses.size == pageSize },
    )
}
