package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.favorite.repository.MemberFavoriteRepository
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.dto.response.MemberDetailResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.secretphoto.repository.SecretPhotoAccessRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.acos
import kotlin.math.cos
import kotlin.math.sin

@Service
class MemberDetailService(

    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val memberLikeRepository: MemberLikeRepository,
    private val memberFavoriteRepository: MemberFavoriteRepository,
    private val secretPhotoAccessRepository: SecretPhotoAccessRepository,
    private val memberBlockRepository: MemberBlockRepository,
    private val photoStorage: PhotoStorage,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findDetail(memberId: Long, targetId: Long): MemberDetailResponse {
        if (memberId == targetId) {
            throw BusinessException(ErrorCode.SELF_MEMBER_DETAIL)
        }

        val me = findMember(memberId)
        val target = findMember(targetId)
        val blockedByThem = memberBlockRepository.existsByBlockerIdAndBlockedMemberId(targetId, memberId)
        val photos = memberPhotoRepository.findAllByMemberId(targetId)

        return MemberDetailResponse(
            memberId = target.id,
            publicPhotoUrls = if (blockedByThem) emptyList() else publicPhotoUrls(photos),
            secretPhotoCount = photos.count { it.visibility == PhotoVisibility.SECRET },
            nickname = target.nickname,
            gender = target.gender,
            age = currentYear() - target.birthYear,
            receivedLikeCount = target.receivedLikeCount,
            locatedAt = target.locatedAt,
            distance = distanceBetween(me, target),
            comment = if (blockedByThem) null else target.visibleComment,
            bio = if (blockedByThem) null else target.visibleBio,
            likedByMe = memberLikeRepository.existsByLikerIdAndLikedMemberId(memberId, targetId),
            favoritedByMe = memberFavoriteRepository.existsByMemberIdAndFavoriteMemberId(memberId, targetId),
            secretPhotoGrantedToMe = secretPhotoAccessRepository.existsByOwnerIdAndViewerId(targetId, memberId),
            secretPhotoGrantedByMe = secretPhotoAccessRepository.existsByOwnerIdAndViewerId(memberId, targetId),
            blockedByMe = memberBlockRepository.existsByBlockerIdAndBlockedMemberId(memberId, targetId),
            noteReceiveEnabled = target.noteReceiveEnabled,
        )
    }

    private fun publicPhotoUrls(photos: List<MemberPhoto>) = photos
        .filter { it.visibility == PhotoVisibility.PUBLIC }
        .sortedBy { it.displayOrder }
        .map { photoStorage.toPublicUrl(it.objectKey) }

    private fun distanceBetween(me: Member, target: Member): Double? {
        val myLatitude = me.latitude ?: return null
        val myLongitude = me.longitude ?: return null
        val targetLatitude = target.latitude ?: return null
        val targetLongitude = target.longitude ?: return null

        val cosine = cos(Math.toRadians(myLatitude)) * cos(Math.toRadians(targetLatitude)) *
                cos(Math.toRadians(targetLongitude) - Math.toRadians(myLongitude)) +
                sin(Math.toRadians(myLatitude)) * sin(Math.toRadians(targetLatitude))

        return EARTH_RADIUS_METERS * acos(cosine.coerceIn(-1.0, 1.0))
    }

    private fun findMember(memberId: Long) = memberRepository.findById(memberId).orElseThrow {
        BusinessException(ErrorCode.MEMBER_NOT_FOUND)
    }

    private fun currentYear() = LocalDate.now(clock.withZone(KOREA)).year

    companion object {

        private const val EARTH_RADIUS_METERS = 6_371_008.8

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
