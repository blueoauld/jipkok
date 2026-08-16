package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.request.CreatePhotoUploadUrlRequest
import com.blueoauld.server.domain.member.dto.request.EditProfileRequest
import com.blueoauld.server.domain.member.dto.request.SetupProfileRequest
import com.blueoauld.server.domain.member.dto.request.UpdateCommentRequest
import com.blueoauld.server.domain.member.dto.request.UpdateFeedNotificationRequest
import com.blueoauld.server.domain.member.dto.request.UpdateNoteReceiveRequest
import com.blueoauld.server.domain.member.dto.response.MyProfileResponse
import com.blueoauld.server.domain.member.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.member.dto.response.ProfilePhotoResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.NicknameHistory
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.event.MemberTextChangedEvent
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.domain.suspension.dto.response.SuspensionResponse
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.event.PhotosDeletedEvent
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId

@Service
class MemberService(

    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val nicknameHistoryRepository: NicknameHistoryRepository,
    private val photoUploadService: PhotoUploadService,
    private val photoStorage: PhotoStorage,
    private val memberSuspensionService: MemberSuspensionService,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Transactional
    fun setupProfile(memberId: Long, request: SetupProfileRequest) {
        val member = findMember(memberId)

        val nickname = request.nickname.trim()
        validateNickname(member, nickname)
        validateBirthYear(request.birthYear)

        changeNickname(member, nickname)
        member.birthYear = request.birthYear
        member.bio = request.bio

        eventPublisher.publishEvent(MemberTextChangedEvent(memberId))
    }

    @Transactional(readOnly = true)
    fun getMyProfile(memberId: Long): MyProfileResponse {
        val member = findMember(memberId)
        val photos = memberPhotoRepository.findAllByMemberId(memberId)

        return MyProfileResponse(
            memberId = member.id,
            nickname = member.nickname,
            gender = member.gender,
            birthYear = member.birthYear,
            age = currentYear() - member.birthYear,
            receivedLikeCount = member.receivedLikeCount,
            comment = member.comment,
            bio = member.bio,
            publicPhotos = profilePhotos(photos, PhotoVisibility.PUBLIC, photoStorage::toPublicUrl),
            secretPhotos = profilePhotos(photos, PhotoVisibility.SECRET, photoStorage::createSignedViewUrl),
            noteReceiveEnabled = member.noteReceiveEnabled,
            feedNotificationEnabled = member.feedNotificationEnabled,
            suspensions = memberSuspensionService.findActive(memberId).map(SuspensionResponse::from),
        )
    }

    @Transactional
    fun editProfile(memberId: Long, request: EditProfileRequest) {
        memberSuspensionService.check(memberId, SuspensionType.PROFILE_EDIT)

        val member = findMember(memberId)

        val nickname = request.nickname.trim()
        validateNickname(member, nickname)
        validateBirthYear(request.birthYear)
        validatePhotoKeys(memberId, request)

        changeNickname(member, nickname)
        member.birthYear = request.birthYear
        member.bio = request.bio

        eventPublisher.publishEvent(MemberTextChangedEvent(memberId))

        val keptKeys = request.publicPhotoKeys + request.secretPhotoKeys
        val removedKeys = memberPhotoRepository.findAllByMemberId(memberId)
            .map { it.objectKey }
            .filterNot { it in keptKeys }

        memberPhotoRepository.deleteAllByMemberId(memberId)
        memberPhotoRepository.flush()
        memberPhotoRepository.saveAll(
            toPhotos(memberId, request.publicPhotoKeys, PhotoVisibility.PUBLIC) +
                toPhotos(memberId, request.secretPhotoKeys, PhotoVisibility.SECRET),
        )
        photoUploadService.confirm(keptKeys)

        if (removedKeys.isNotEmpty()) {
            eventPublisher.publishEvent(PhotosDeletedEvent(removedKeys))
        }
    }

    fun createPhotoUploadUrl(memberId: Long, request: CreatePhotoUploadUrlRequest): PhotoUploadUrlResponse {
        memberSuspensionService.check(memberId, SuspensionType.PROFILE_EDIT)

        val prefix = photoKeyPrefix(memberId, request.visibility)
        val issued = photoUploadService.createUploadUrl(memberId, prefix, request.contentType)

        return PhotoUploadUrlResponse(issued.uploadUrl, issued.objectKey)
    }

    @Transactional
    fun updateNoteReceive(memberId: Long, request: UpdateNoteReceiveRequest) {
        findMember(memberId).noteReceiveEnabled = request.enabled
    }

    @Transactional
    fun updateFeedNotification(memberId: Long, request: UpdateFeedNotificationRequest) {
        findMember(memberId).feedNotificationEnabled = request.enabled
    }

    @Transactional
    fun updateComment(memberId: Long, request: UpdateCommentRequest) {
        memberSuspensionService.check(memberId, SuspensionType.PROFILE_EDIT)

        findMember(memberId).comment = request.comment?.ifEmpty { null }

        eventPublisher.publishEvent(MemberTextChangedEvent(memberId))
    }

    private fun findMember(memberId: Long) = memberRepository.findById(memberId).orElseThrow {
        BusinessException(ErrorCode.MEMBER_NOT_FOUND)
    }

    private fun changeNickname(member: Member, nickname: String) {
        if (member.nickname == nickname) {
            return
        }

        member.nickname = nickname
        nicknameHistoryRepository.save(NicknameHistory(member.id, nickname))
    }

    private fun validateNickname(member: Member, nickname: String) {
        if (!nickname.equals(member.nickname, ignoreCase = true) &&
            memberRepository.existsByNicknameIgnoreCase(nickname)
        ) {
            throw BusinessException(ErrorCode.DUPLICATE_NICKNAME)
        }
    }

    private fun validateBirthYear(birthYear: Int) {
        if (currentYear() - birthYear !in MIN_AGE..MAX_AGE) {
            throw BusinessException(ErrorCode.INVALID_BIRTH_YEAR)
        }
    }

    private fun validatePhotoKeys(memberId: Long, request: EditProfileRequest) {
        val objectKeys = request.publicPhotoKeys + request.secretPhotoKeys

        if (objectKeys.size != objectKeys.toSet().size) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }

        validatePhotoKeyPrefix(memberId, request.publicPhotoKeys, PhotoVisibility.PUBLIC)
        validatePhotoKeyPrefix(memberId, request.secretPhotoKeys, PhotoVisibility.SECRET)
    }

    private fun validatePhotoKeyPrefix(memberId: Long, objectKeys: List<String>, visibility: PhotoVisibility) {
        val prefix = photoKeyPrefix(memberId, visibility)

        if (objectKeys.any { !it.startsWith(prefix) }) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }
    }

    private fun toPhotos(memberId: Long, objectKeys: List<String>, visibility: PhotoVisibility) =
        objectKeys.mapIndexed { index, objectKey -> MemberPhoto(memberId, visibility, index, objectKey) }

    private fun profilePhotos(
        photos: List<MemberPhoto>,
        visibility: PhotoVisibility,
        toUrl: (String) -> String,
    ) = photos.filter { it.visibility == visibility }
        .sortedBy { it.displayOrder }
        .map { ProfilePhotoResponse(it.objectKey, toUrl(it.objectKey)) }

    private fun photoKeyPrefix(memberId: Long, visibility: PhotoVisibility) =
        "$PHOTO_KEY_ROOT/$memberId/${visibility.name.lowercase()}/"

    private fun currentYear() = LocalDate.now(clock.withZone(KOREA)).year

    companion object {

        const val MIN_AGE = 19
        const val MAX_AGE = 90

        private const val PHOTO_KEY_ROOT = "members"

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
