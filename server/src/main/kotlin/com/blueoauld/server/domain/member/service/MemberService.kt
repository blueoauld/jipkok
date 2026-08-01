package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.auth.service.AuthService
import com.blueoauld.server.domain.auth.service.VerificationCodeService
import com.blueoauld.server.domain.member.dto.request.CreatePhotoUploadUrlRequest
import com.blueoauld.server.domain.member.dto.request.EditProfileRequest
import com.blueoauld.server.domain.member.dto.request.HeartbeatRequest
import com.blueoauld.server.domain.member.dto.request.SetupProfileRequest
import com.blueoauld.server.domain.member.dto.request.SignupRequest
import com.blueoauld.server.domain.member.dto.request.UpdateCommentRequest
import com.blueoauld.server.domain.member.dto.response.MyProfileResponse
import com.blueoauld.server.domain.member.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.member.dto.response.ProfilePhotoResponse
import com.blueoauld.server.domain.member.dto.response.SignupResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.event.PhotosDeletedEvent
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.storage.service.PhotoUploadService
import org.springframework.context.ApplicationEventPublisher
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId
import java.util.*

@Service
class MemberService(

    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val photoUploadService: PhotoUploadService,
    private val verificationCodeService: VerificationCodeService,
    private val authService: AuthService,
    private val passwordEncoder: PasswordEncoder,
    private val photoStorage: PhotoStorage,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Transactional
    fun signup(request: SignupRequest): SignupResponse {
        if (request.password != request.passwordConfirm) {
            throw BusinessException(ErrorCode.PASSWORD_CONFIRM_MISMATCH)
        }

        verificationCodeService.verify(request.phoneNumber, request.verificationCode)

        if (memberRepository.existsByPhoneNumber(request.phoneNumber)) {
            throw BusinessException(ErrorCode.DUPLICATE_PHONE_NUMBER)
        }

        val member = memberRepository.save(
            Member(
                phoneNumber = request.phoneNumber,
                password = encodePassword(request.password),
                gender = request.gender,
                nickname = generateNickname(),
                birthYear = DEFAULT_BIRTH_YEAR,
            ),
        )
        val tokens = authService.issueTokens(member)

        return SignupResponse(member.id, tokens.accessToken, tokens.refreshToken)
    }

    @Transactional
    fun setupProfile(memberId: Long, request: SetupProfileRequest) {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        val nickname = request.nickname.trim()
        validateNickname(member, nickname)
        validateBirthYear(request.birthYear)

        member.nickname = nickname
        member.birthYear = request.birthYear
        member.bio = request.bio
    }

    @Transactional(readOnly = true)
    fun getMyProfile(memberId: Long): MyProfileResponse {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }
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
        )
    }

    @Transactional
    fun editProfile(memberId: Long, request: EditProfileRequest) {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        val nickname = request.nickname.trim()
        validateNickname(member, nickname)
        validateBirthYear(request.birthYear)
        validatePhotoKeys(memberId, request)

        member.nickname = nickname
        member.birthYear = request.birthYear
        member.bio = request.bio

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
        val prefix = photoKeyPrefix(memberId, request.visibility)
        val issued = photoUploadService.createUploadUrl(memberId, prefix, request.contentType)

        return PhotoUploadUrlResponse(issued.uploadUrl, issued.objectKey)
    }

    @Transactional
    fun updateComment(memberId: Long, request: UpdateCommentRequest) {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        member.comment = request.comment?.ifEmpty { null }
    }

    @Transactional
    fun heartbeat(memberId: Long, request: HeartbeatRequest) {
        val member = memberRepository.findById(memberId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }

        if ((request.latitude == null) != (request.longitude == null)) {
            throw BusinessException(ErrorCode.INVALID_LOCATION)
        }

        member.latitude = request.latitude
        member.longitude = request.longitude
        member.locatedAt = clock.instant()
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

    private fun encodePassword(rawPassword: String) = checkNotNull(passwordEncoder.encode(rawPassword)) {
        "비밀번호를 해싱하지 못했다."
    }

    private fun generateNickname() = UUID.randomUUID().toString().replace("-", "").take(Member.NICKNAME_MAX_LENGTH)

    companion object {

        const val DEFAULT_BIRTH_YEAR = 1998
        const val MIN_AGE = 19
        const val MAX_AGE = 90

        private const val PHOTO_KEY_ROOT = "members"

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
