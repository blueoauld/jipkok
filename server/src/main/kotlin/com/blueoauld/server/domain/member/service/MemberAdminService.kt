package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.NicknameHistory
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.domain.member.repository.getMember
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
    fun findNickname(memberId: Long): String = memberRepository.getMember(memberId).nickname

    @Transactional(readOnly = true)
    fun findNicknames(memberIds: Collection<Long>): Map<Long, String> {
        val ids = memberIds.distinct()

        if (ids.isEmpty()) {
            return emptyMap()
        }

        val found = memberRepository.findNicknamesByIdIn(ids).associate { it.id to it.nickname }

        return ids.associateWith { found[it] ?: UNKNOWN_NICKNAME }
    }

    @Transactional(readOnly = true)
    fun findPhotoUrls(memberId: Long): Map<PhotoVisibility, List<String>> =
        memberPhotoRepository.findAllByMemberId(memberId)
            .sortedBy { it.displayOrder }
            .groupBy { it.visibility }
            .mapValues { (visibility, photos) ->
                val toUrl = if (visibility == PhotoVisibility.PUBLIC) {
                    photoStorage::toPublicUrl
                } else {
                    photoStorage::createSignedViewUrl
                }

                photos.map { toUrl(it.objectKey) }
            }

    @Transactional
    fun resetProfile(memberId: Long, target: ProfileTarget) {
        val member = memberRepository.getMember(memberId)

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

    companion object {

        private const val UNKNOWN_NICKNAME = "알 수 없음"
    }
}
