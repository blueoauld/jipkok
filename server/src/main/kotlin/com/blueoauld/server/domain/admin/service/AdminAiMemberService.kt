package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.response.AdminAiMemberDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAiMemberPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAiMemberResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAiReplyStatResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAiTestChatResponse
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.AiMemberAdminRepository
import com.blueoauld.server.domain.admin.repository.AiReplyLogAdminRepository
import com.blueoauld.server.domain.ai.dto.request.AiTestChatRequest
import com.blueoauld.server.domain.ai.dto.request.CreateAiMemberRequest
import com.blueoauld.server.domain.ai.dto.request.UpdateAiMemberPhotosRequest
import com.blueoauld.server.domain.ai.dto.request.UpdateAiMemberRequest
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.repository.getPersona
import com.blueoauld.server.domain.ai.service.AiMemberService
import com.blueoauld.server.domain.ai.service.AiReplyContextService
import com.blueoauld.server.domain.ai.service.AiTestChatService
import com.blueoauld.server.domain.member.dto.request.CreateProfilePhotoUploadUrlRequest
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.member.service.MemberPhotoService
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.global.repository.escapeLike
import com.blueoauld.server.global.time.KOREA
import com.blueoauld.server.global.time.ageOf
import com.blueoauld.server.global.time.today
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant

@Service
class AdminAiMemberService(

    private val aiMemberAdminRepository: AiMemberAdminRepository,
    private val aiReplyLogAdminRepository: AiReplyLogAdminRepository,
    private val aiPersonaRepository: AiPersonaRepository,
    private val memberRepository: MemberRepository,
    private val memberPhotoService: MemberPhotoService,
    private val aiMemberService: AiMemberService,
    private val aiTestChatService: AiTestChatService,
    private val adminActionRecorder: AdminActionRecorder,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findMembers(enabled: Boolean?, keyword: String?, page: Int, size: Int): AdminAiMemberPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)
        val nicknameLike = keyword?.trim()?.takeIf { it.isNotEmpty() }?.let { "%${it.escapeLike()}%" }

        val rows = aiMemberAdminRepository.findAllForAdmin(
            enabled = enabled,
            nicknameLike = nicknameLike,
            size = safeSize,
            offset = AdminPaging.offset(safePage, safeSize),
        )

        val dayStart = dayStart()
        val ids = rows.map { it.id }
        val today = statsByMember(ids, dayStart)
        val total = statsByMember(ids, Instant.EPOCH)

        return AdminAiMemberPageResponse(
            items = rows.map {
                AdminAiMemberResponse(
                    id = it.id,
                    nickname = it.nickname,
                    gender = Gender.valueOf(it.gender),
                    age = clock.ageOf(it.birthYear),
                    enabled = it.enabled,
                    publicPhotoCount = it.publicPhotoCount.toInt(),
                    locatedAt = it.locatedAt,
                    createdAt = it.createdAt,
                    today = today[it.id] ?: AdminAiReplyStatResponse.EMPTY,
                    total = total[it.id] ?: AdminAiReplyStatResponse.EMPTY,
                )
            },
            page = safePage,
            size = safeSize,
            totalCount = aiMemberAdminRepository.countForAdmin(enabled, nicknameLike),
            todayTotal = AdminAiReplyStatResponse.of(aiReplyLogAdminRepository.sumAllSince(dayStart)),
            globalDailyLimit = AiReplyContextService.GLOBAL_DAILY_LIMIT,
        )
    }

    @Transactional(readOnly = true)
    fun findDetail(memberId: Long): AdminAiMemberDetailResponse {
        val persona = aiPersonaRepository.getPersona(memberId)
        val member = memberRepository.getMember(memberId)
        val photos = memberPhotoService.findProfilePhotos(memberId)
        val ids = listOf(memberId)

        return AdminAiMemberDetailResponse.of(
            member = member,
            persona = persona,
            age = clock.ageOf(member.birthYear),
            publicPhotos = photos[PhotoVisibility.PUBLIC].orEmpty(),
            secretPhotos = photos[PhotoVisibility.SECRET].orEmpty(),
            today = statsByMember(ids, dayStart())[memberId] ?: AdminAiReplyStatResponse.EMPTY,
            total = statsByMember(ids, Instant.EPOCH)[memberId] ?: AdminAiReplyStatResponse.EMPTY,
        )
    }

    fun testChat(memberId: Long, request: AiTestChatRequest): AdminAiTestChatResponse =
        AdminAiTestChatResponse.of(aiTestChatService.chat(memberId, request))

    @Transactional
    fun create(actorId: Long, request: CreateAiMemberRequest): AdminAiMemberDetailResponse {
        val memberId = aiMemberService.create(request)
        adminActionRecorder.record(actorId = actorId, action = AdminActionType.CREATE_AI_MEMBER, targetId = memberId)

        return findDetail(memberId)
    }

    @Transactional
    fun update(actorId: Long, memberId: Long, request: UpdateAiMemberRequest): AdminAiMemberDetailResponse {
        aiMemberService.update(memberId, request)
        adminActionRecorder.record(actorId = actorId, action = AdminActionType.UPDATE_AI_MEMBER, targetId = memberId)

        return findDetail(memberId)
    }

    fun createPhotoUploadUrl(memberId: Long, request: CreateProfilePhotoUploadUrlRequest): PhotoUploadUrlResponse =
        aiMemberService.createPhotoUploadUrl(memberId, request.visibility, request.contentType)

    @Transactional
    fun updatePhotos(actorId: Long, memberId: Long, request: UpdateAiMemberPhotosRequest) {
        aiMemberService.updatePhotos(memberId, request.publicPhotoKeys, request.secretPhotoKeys)
        adminActionRecorder.record(
            actorId = actorId,
            action = AdminActionType.UPDATE_AI_MEMBER,
            targetId = memberId,
            detail = PHOTOS_DETAIL,
        )
    }

    @Transactional
    fun withdraw(actorId: Long, memberId: Long) {
        aiMemberService.withdraw(memberId)
        adminActionRecorder.record(actorId = actorId, action = AdminActionType.WITHDRAW_MEMBER, targetId = memberId)
    }

    private fun statsByMember(ids: List<Long>, start: Instant): Map<Long, AdminAiReplyStatResponse> {
        if (ids.isEmpty()) {
            return emptyMap()
        }

        return aiReplyLogAdminRepository.sumByAiMemberIdSince(ids, start)
            .associate { it.aiMemberId to AdminAiReplyStatResponse.of(it) }
    }

    private fun dayStart(): Instant = clock.today().atStartOfDay(KOREA).toInstant()

    companion object {

        private const val PHOTOS_DETAIL = "PHOTOS"
    }
}
