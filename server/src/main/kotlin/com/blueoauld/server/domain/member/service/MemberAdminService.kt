package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.NicknameHistory
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.event.PhotosDeletedEvent
import com.blueoauld.server.global.storage.service.PhotoStorage
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberAdminService(

    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val nicknameHistoryRepository: NicknameHistoryRepository,
    private val photoStorage: PhotoStorage,
    private val eventPublisher: ApplicationEventPublisher,
) {

    @Transactional(readOnly = true)
    fun findNickname(memberId: Long): String = findMember(memberId).nickname

    @Transactional(readOnly = true)
    fun findPhotoUrls(memberId: Long, visibility: PhotoVisibility): List<String> {
        val toUrl = if (visibility == PhotoVisibility.PUBLIC) {
            photoStorage::toPublicUrl
        } else {
            photoStorage::createSignedViewUrl
        }

        return memberPhotoRepository.findAllByMemberId(memberId)
            .filter { it.visibility == visibility }
            .sortedBy { it.displayOrder }
            .map { toUrl(it.objectKey) }
    }

    @Transactional
    fun resetProfile(memberId: Long, target: ProfileTarget) {
        val member = findMember(memberId)

        when (target) {
            ProfileTarget.NICKNAME -> resetNickname(member)
            ProfileTarget.COMMENT -> member.comment = null
            ProfileTarget.BIO -> member.bio = null
            ProfileTarget.PUBLIC_PHOTO -> deletePhotos(memberId, PhotoVisibility.PUBLIC)
            ProfileTarget.SECRET_PHOTO -> deletePhotos(memberId, PhotoVisibility.SECRET)
        }
    }

    private fun resetNickname(member: Member) {
        member.nickname = Member.generateNickname()
        nicknameHistoryRepository.save(NicknameHistory(member.id, member.nickname))
    }

    private fun deletePhotos(memberId: Long, visibility: PhotoVisibility) {
        val photos = memberPhotoRepository.findAllByMemberId(memberId).filter { it.visibility == visibility }

        if (photos.isEmpty()) {
            return
        }

        memberPhotoRepository.deleteAll(photos)
        eventPublisher.publishEvent(PhotosDeletedEvent(photos.map { it.objectKey }))
    }

    private fun findMember(memberId: Long) = memberRepository.findById(memberId).orElseThrow {
        BusinessException(ErrorCode.MEMBER_NOT_FOUND)
    }
}
