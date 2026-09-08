package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.favorite.repository.MemberFavoriteRepository
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.dto.response.MemberDetailResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.displayOrdered
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.memo.service.MemberMemoService
import com.blueoauld.server.domain.profileview.event.ProfileViewedEvent
import com.blueoauld.server.domain.secretphoto.repository.SecretPhotoAccessRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.time.ageOf
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class MemberDetailService(

    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val memberLikeRepository: MemberLikeRepository,
    private val memberFavoriteRepository: MemberFavoriteRepository,
    private val secretPhotoAccessRepository: SecretPhotoAccessRepository,
    private val memberBlockRepository: MemberBlockRepository,
    private val contactBlockRepository: ContactBlockRepository,
    private val memberMemoService: MemberMemoService,
    private val eventPublisher: ApplicationEventPublisher,
    private val photoStorage: PhotoStorage,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findDetail(memberId: Long, targetId: Long): MemberDetailResponse {
        if (memberId == targetId) {
            throw BusinessException(ErrorCode.SELF_MEMBER_DETAIL)
        }

        val me = memberRepository.getMember(memberId)
        val target = memberRepository.getMember(targetId)

        if (contactBlockRepository.existsBetween(memberId, targetId)) {
            throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        val blockedByThem = memberBlockRepository.existsByBlockerIdAndBlockedMemberId(targetId, memberId)
        val blockedByMe = memberBlockRepository.existsByBlockerIdAndBlockedMemberId(memberId, targetId)
        val photos = memberPhotoRepository.findAllByMemberId(targetId)

        if (!blockedByThem && !blockedByMe) {
            eventPublisher.publishEvent(ProfileViewedEvent(memberId, targetId))
        }

        return MemberDetailResponse(
            memberId = target.id,
            publicPhotoUrls = if (blockedByThem) emptyList() else publicPhotoUrls(photos),
            secretPhotoCount = if (blockedByThem) 0 else photos.count { it.visibility == PhotoVisibility.SECRET },
            nickname = target.nickname,
            gender = target.gender,
            age = clock.ageOf(target.birthYear),
            receivedLikeCount = target.receivedLikeCount,
            locatedAt = target.locatedAt,
            distance = distanceBetween(me, target),
            comment = if (blockedByThem) null else target.comment,
            bio = if (blockedByThem) null else target.bio,
            memo = memberMemoService.findContent(memberId, targetId),
            likedByMe = memberLikeRepository.existsByLikerIdAndLikedMemberId(memberId, targetId),
            favoritedByMe = memberFavoriteRepository.existsByMemberIdAndFavoriteMemberId(memberId, targetId),
            secretPhotoGrantedToMe = secretPhotoAccessRepository.existsByOwnerIdAndViewerId(targetId, memberId),
            secretPhotoGrantedByMe = secretPhotoAccessRepository.existsByOwnerIdAndViewerId(memberId, targetId),
            blockedByMe = blockedByMe,
            noteReceiveEnabled = target.noteReceiveEnabled,
        )
    }

    private fun publicPhotoUrls(photos: List<MemberPhoto>) = photos
        .displayOrdered(PhotoVisibility.PUBLIC)
        .map { photoStorage.toPublicUrl(it.objectKey) }

    private fun distanceBetween(me: Member, target: Member): Double? {
        val myLatitude = me.latitude ?: return null
        val myLongitude = me.longitude ?: return null
        val targetLatitude = target.latitude ?: return null
        val targetLongitude = target.longitude ?: return null

        return sphericalDistanceMeters(myLatitude, myLongitude, targetLatitude, targetLongitude)
    }
}
