package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.request.AiPersonaRequest
import com.blueoauld.server.domain.ai.dto.request.CreateAiMemberRequest
import com.blueoauld.server.domain.ai.dto.request.UpdateAiMemberRequest
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.repository.getPersona
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.NicknameHistory
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.member.service.MemberPhotoService
import com.blueoauld.server.domain.member.service.MemberWithdrawService
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.security.encodePassword
import com.blueoauld.server.global.time.ageOf
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.util.*

@Service
class AiMemberService(

    private val memberRepository: MemberRepository,
    private val nicknameHistoryRepository: NicknameHistoryRepository,
    private val aiPersonaRepository: AiPersonaRepository,
    private val memberPhotoService: MemberPhotoService,
    private val memberWithdrawService: MemberWithdrawService,
    private val passwordEncoder: PasswordEncoder,
    private val clock: Clock,
) {

    @Transactional
    fun create(request: CreateAiMemberRequest): Long {
        val nickname = request.nickname.trim()
        val persona = request.persona!!

        validateBirthYear(request.birthYear)
        validateReplyDelay(persona)

        if (memberRepository.existsByNicknameIgnoreCase(nickname)) {
            throw BusinessException(ErrorCode.DUPLICATE_NICKNAME)
        }

        val now = clock.instant()
        val member = memberRepository.save(
            Member(
                phoneNumber = Member.generateAiPhoneNumber(),
                password = passwordEncoder.encodePassword(UUID.randomUUID().toString()),
                gender = request.gender!!,
                nickname = nickname,
                birthYear = request.birthYear,
                comment = request.comment.normalized(),
                bio = request.bio.normalized(),
                role = MemberRole.AI,
                latitude = request.latitude,
                longitude = request.longitude,
                locatedAt = now,
            ),
        )
        nicknameHistoryRepository.save(NicknameHistory(member.id, nickname))
        aiPersonaRepository.save(
            AiPersona(
                memberId = member.id,
                enabled = persona.enabled,
                systemPrompt = persona.systemPrompt.trim(),
                replyDelayMinSeconds = persona.replyDelayMinSeconds,
                replyDelayMaxSeconds = persona.replyDelayMaxSeconds,
                activeStartHour = persona.activeStartHour,
                activeEndHour = persona.activeEndHour,
                dailyReplyLimit = persona.dailyReplyLimit,
                nextLocationRefreshAt = now,
            ),
        )

        return member.id
    }

    @Transactional
    fun update(memberId: Long, request: UpdateAiMemberRequest) {
        val persona = aiPersonaRepository.getPersona(memberId)
        val member = memberRepository.getMember(memberId)
        val nickname = request.nickname.trim()
        val personaRequest = request.persona!!

        validateBirthYear(request.birthYear)
        validateReplyDelay(personaRequest)

        if (!nickname.equals(member.nickname, ignoreCase = true) &&
            memberRepository.existsByNicknameIgnoreCase(nickname)
        ) {
            throw BusinessException(ErrorCode.DUPLICATE_NICKNAME)
        }

        if (member.nickname != nickname) {
            member.nickname = nickname
            nicknameHistoryRepository.save(NicknameHistory(member.id, nickname))
        }

        member.birthYear = request.birthYear
        member.comment = request.comment.normalized()
        member.bio = request.bio.normalized()
        member.latitude = request.latitude
        member.longitude = request.longitude

        persona.update(
            enabled = personaRequest.enabled,
            systemPrompt = personaRequest.systemPrompt.trim(),
            replyDelayMinSeconds = personaRequest.replyDelayMinSeconds,
            replyDelayMaxSeconds = personaRequest.replyDelayMaxSeconds,
            activeStartHour = personaRequest.activeStartHour,
            activeEndHour = personaRequest.activeEndHour,
            dailyReplyLimit = personaRequest.dailyReplyLimit,
        )
    }

    fun createPhotoUploadUrl(memberId: Long, visibility: PhotoVisibility, contentType: String): PhotoUploadUrlResponse {
        aiPersonaRepository.getPersona(memberId)

        return memberPhotoService.createUploadUrl(memberId, visibility, contentType)
    }

    @Transactional
    fun updatePhotos(memberId: Long, publicPhotoKeys: List<String>, secretPhotoKeys: List<String>) {
        aiPersonaRepository.getPersona(memberId)
        memberPhotoService.replace(memberId, publicPhotoKeys, secretPhotoKeys)
    }

    @Transactional
    fun withdraw(memberId: Long) {
        val persona = aiPersonaRepository.getPersona(memberId)

        memberWithdrawService.withdraw(memberId)
        aiPersonaRepository.delete(persona)
    }

    private fun validateBirthYear(birthYear: Int) {
        if (clock.ageOf(birthYear) !in Member.MIN_AGE..Member.MAX_AGE) {
            throw BusinessException(ErrorCode.INVALID_BIRTH_YEAR)
        }
    }

    private fun validateReplyDelay(persona: AiPersonaRequest) {
        if (persona.replyDelayMinSeconds > persona.replyDelayMaxSeconds) {
            throw BusinessException(ErrorCode.INVALID_REPLY_DELAY)
        }
    }

    private fun String?.normalized() = this?.trim()?.ifEmpty { null }
}
