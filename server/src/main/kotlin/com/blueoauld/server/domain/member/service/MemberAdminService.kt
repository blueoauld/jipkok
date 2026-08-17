package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.response.AdminMemberDetail
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
import com.blueoauld.server.global.time.currentYear
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class MemberAdminService(

    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val nicknameHistoryRepository: NicknameHistoryRepository,
    private val photoStorage: PhotoStorage,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findForAdmin(memberId: Long): AdminMemberDetail {
        val member = findMember(memberId)
        val photos = memberPhotoRepository.findAllByMemberId(memberId)

        return AdminMemberDetail(
            memberId = member.id,
            nickname = member.nickname,
            phoneNumber = member.phoneNumber,
            gender = member.gender,
            birthYear = member.birthYear,
            age = clock.currentYear() - member.birthYear,
            comment = member.comment,
            bio = member.bio,
            publicPhotoCount = photos.count { it.visibility == PhotoVisibility.PUBLIC },
            secretPhotoCount = photos.count { it.visibility == PhotoVisibility.SECRET },
            receivedLikeCount = member.receivedLikeCount,
            pointBalance = member.pointBalance,
            noteReceiveEnabled = member.noteReceiveEnabled,
            locatedAt = member.locatedAt,
            joinedAt = member.createdAt,
        )
    }

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
    fun resetProfile(memberId: Long, target: ProfileTarget): String {
        val member = findMember(memberId)

        when (target) {
            ProfileTarget.NICKNAME -> resetNickname(member)
            ProfileTarget.COMMENT -> member.comment = null
            ProfileTarget.BIO -> member.bio = null
            ProfileTarget.PUBLIC_PHOTO -> deletePhotos(memberId, PhotoVisibility.PUBLIC)
            ProfileTarget.SECRET_PHOTO -> deletePhotos(memberId, PhotoVisibility.SECRET)
        }

        return member.nickname
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
