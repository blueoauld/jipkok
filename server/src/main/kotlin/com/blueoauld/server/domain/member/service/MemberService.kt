package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.request.CreateProfilePhotoUploadUrlRequest
import com.blueoauld.server.domain.member.dto.request.EditProfileRequest
import com.blueoauld.server.domain.member.dto.request.SetupProfileRequest
import com.blueoauld.server.domain.member.dto.request.UpdateCommentRequest
import com.blueoauld.server.domain.member.dto.response.MyProfileResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.NicknameHistory
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.event.MemberTextChangedEvent
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.suspension.dto.response.SuspensionResponse
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.request.EnabledRequest
import com.blueoauld.server.global.time.ageOf
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class MemberService(

    private val memberRepository: MemberRepository,
    private val nicknameHistoryRepository: NicknameHistoryRepository,
    private val memberPhotoService: MemberPhotoService,
    private val memberSuspensionService: MemberSuspensionService,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Transactional
    fun setupProfile(memberId: Long, request: SetupProfileRequest) {
        val member = memberRepository.getMember(memberId)

        val nickname = request.nickname.trim()
        validateNickname(member, nickname)
        validateBirthYear(request.birthYear)

        changeNickname(member, nickname)
        member.birthYear = request.birthYear
        member.bio = request.bio?.trim()?.ifEmpty { null }

        eventPublisher.publishEvent(MemberTextChangedEvent(memberId))
    }

    @Transactional(readOnly = true)
    fun findMyProfile(memberId: Long): MyProfileResponse {
        val member = memberRepository.getMember(memberId)
        val photos = memberPhotoService.findProfilePhotos(memberId)

        return MyProfileResponse(
            memberId = member.id,
            nickname = member.nickname,
            gender = member.gender,
            birthYear = member.birthYear,
            age = clock.ageOf(member.birthYear),
            receivedLikeCount = member.receivedLikeCount,
            comment = member.comment,
            bio = member.bio,
            publicPhotos = photos[PhotoVisibility.PUBLIC].orEmpty(),
            secretPhotos = photos[PhotoVisibility.SECRET].orEmpty(),
            noteReceiveEnabled = member.noteReceiveEnabled,
            feedNotificationEnabled = member.feedNotificationEnabled,
            suspensions = memberSuspensionService.findActive(memberId).map(SuspensionResponse::from),
        )
    }

    @Transactional
    fun editProfile(memberId: Long, request: EditProfileRequest) {
        memberSuspensionService.check(memberId, SuspensionType.PROFILE_EDIT)

        val member = memberRepository.getMember(memberId)

        val nickname = request.nickname.trim()
        validateNickname(member, nickname)
        validateBirthYear(request.birthYear)

        changeNickname(member, nickname)
        member.birthYear = request.birthYear
        member.bio = request.bio?.trim()?.ifEmpty { null }

        eventPublisher.publishEvent(MemberTextChangedEvent(memberId))

        memberPhotoService.replace(memberId, request.publicPhotoKeys, request.secretPhotoKeys)
    }

    fun createPhotoUploadUrl(memberId: Long, request: CreateProfilePhotoUploadUrlRequest): PhotoUploadUrlResponse {
        memberSuspensionService.check(memberId, SuspensionType.PROFILE_EDIT)

        return memberPhotoService.createUploadUrl(memberId, request.visibility, request.contentType)
    }

    @Transactional
    fun updateNoteReceive(memberId: Long, request: EnabledRequest) {
        memberRepository.getMember(memberId).noteReceiveEnabled = request.enabled
    }

    @Transactional
    fun updateFeedNotification(memberId: Long, request: EnabledRequest) {
        memberRepository.getMember(memberId).feedNotificationEnabled = request.enabled
    }

    @Transactional
    fun updateLocale(memberId: Long, locale: MemberLocale) {
        memberRepository.getMember(memberId).locale = locale
    }

    @Transactional
    fun updateComment(memberId: Long, request: UpdateCommentRequest) {
        memberSuspensionService.check(memberId, SuspensionType.PROFILE_EDIT)

        memberRepository.getMember(memberId).comment = request.comment?.trim()?.ifEmpty { null }

        eventPublisher.publishEvent(MemberTextChangedEvent(memberId))
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
        if (clock.ageOf(birthYear) !in Member.MIN_AGE..Member.MAX_AGE) {
            throw BusinessException(ErrorCode.INVALID_BIRTH_YEAR)
        }
    }
}
