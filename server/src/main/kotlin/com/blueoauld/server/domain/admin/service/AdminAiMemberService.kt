package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.response.AdminAiMemberDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAiMemberPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAiMemberResponse
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.AiMemberAdminRepository
import com.blueoauld.server.domain.ai.dto.request.CreateAiMemberRequest
import com.blueoauld.server.domain.ai.dto.request.UpdateAiMemberPhotosRequest
import com.blueoauld.server.domain.ai.dto.request.UpdateAiMemberRequest
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.repository.getPersona
import com.blueoauld.server.domain.ai.service.AiMemberService
import com.blueoauld.server.domain.member.dto.request.CreateProfilePhotoUploadUrlRequest
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.member.service.MemberPhotoService
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.global.repository.escapeLike
import com.blueoauld.server.global.time.ageOf
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class AdminAiMemberService(

    private val aiMemberAdminRepository: AiMemberAdminRepository,
    private val aiPersonaRepository: AiPersonaRepository,
    private val memberRepository: MemberRepository,
    private val memberPhotoService: MemberPhotoService,
    private val aiMemberService: AiMemberService,
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
                )
            },
            page = safePage,
            size = safeSize,
            totalCount = aiMemberAdminRepository.countForAdmin(enabled, nicknameLike),
        )
    }

    @Transactional(readOnly = true)
    fun findDetail(memberId: Long): AdminAiMemberDetailResponse {
        val persona = aiPersonaRepository.getPersona(memberId)
        val member = memberRepository.getMember(memberId)
        val photos = memberPhotoService.findProfilePhotos(memberId)

        return AdminAiMemberDetailResponse.of(
            member = member,
            persona = persona,
            age = clock.ageOf(member.birthYear),
            publicPhotos = photos[PhotoVisibility.PUBLIC].orEmpty(),
            secretPhotos = photos[PhotoVisibility.SECRET].orEmpty(),
        )
    }

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

    companion object {

        private const val PHOTOS_DETAIL = "PHOTOS"
    }
}
