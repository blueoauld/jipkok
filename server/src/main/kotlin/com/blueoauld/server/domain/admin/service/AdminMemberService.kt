package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminMemberStatus
import com.blueoauld.server.domain.admin.dto.response.AdminMemberDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMemberPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMemberResponse
import com.blueoauld.server.domain.admin.dto.response.AdminSuspensionResponse
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberAdminRepository
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.domain.suspension.repository.MemberSuspensionRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.time.currentYear
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class AdminMemberService(

    private val memberAdminRepository: MemberAdminRepository,
    private val memberSuspensionRepository: MemberSuspensionRepository,
    private val memberAdminService: MemberAdminService,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findMembers(
        status: AdminMemberStatus,
        gender: Gender?,
        keyword: String?,
        page: Int,
        size: Int,
    ): AdminMemberPageResponse {
        val safePage = page.coerceAtLeast(1)
        val safeSize = size.coerceIn(1, MAX_PAGE_SIZE)
        val now = clock.instant()
        val currentYear = clock.currentYear()

        val trimmed = keyword?.trim()?.takeIf { it.isNotEmpty() }
        val digits = trimmed?.takeIf { it.all(Char::isDigit) }
        val keywordId = digits?.let { it.toLongOrNull() ?: 0 }
        val phoneLike = digits?.let { "%$it%" }
        val nicknameLike = trimmed?.takeIf { digits == null }?.let { "%$it%" }

        val statusName = status.takeIf { it != AdminMemberStatus.ALL }?.name

        val rows = memberAdminRepository.findAllForAdmin(
            status = statusName,
            gender = gender?.name,
            keywordId = keywordId,
            phoneLike = phoneLike,
            nicknameLike = nicknameLike,
            now = now,
            size = safeSize,
            offset = (safePage - 1) * safeSize,
        )
        val totalCount = memberAdminRepository.countForAdmin(
            status = statusName,
            gender = gender?.name,
            keywordId = keywordId,
            phoneLike = phoneLike,
            nicknameLike = nicknameLike,
            now = now,
        )

        return AdminMemberPageResponse(
            items = rows.map {
                AdminMemberResponse(
                    id = it.id,
                    nickname = it.nickname,
                    gender = Gender.valueOf(it.gender),
                    age = currentYear - it.birthYear,
                    phoneNumber = it.phoneNumber,
                    publicPhotoCount = it.publicPhotoCount.toInt(),
                    secretPhotoCount = it.secretPhotoCount.toInt(),
                    suspended = it.suspended,
                    withdrawnAt = it.withdrawnAt,
                    joinedAt = it.joinedAt,
                )
            },
            page = safePage,
            size = safeSize,
            totalCount = totalCount,
        )
    }

    @Transactional(readOnly = true)
    fun findDetail(memberId: Long): AdminMemberDetailResponse {
        val row = memberAdminRepository.findRowById(memberId)
            ?: throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        val now = clock.instant()

        return AdminMemberDetailResponse(
            id = row.id,
            nickname = row.nickname,
            phoneNumber = row.phoneNumber,
            gender = Gender.valueOf(row.gender),
            age = clock.currentYear() - row.birthYear,
            comment = row.comment,
            bio = row.bio,
            receivedLikeCount = row.receivedLikeCount,
            pointBalance = row.pointBalance,
            noteReceiveEnabled = row.noteReceiveEnabled,
            latitude = row.latitude,
            longitude = row.longitude,
            locatedAt = row.locatedAt,
            joinedAt = row.joinedAt,
            withdrawnAt = row.withdrawnAt,
            publicPhotoUrls = memberAdminService.findPhotoUrls(memberId, PhotoVisibility.PUBLIC),
            secretPhotoUrls = memberAdminService.findPhotoUrls(memberId, PhotoVisibility.SECRET),
            suspensions = memberSuspensionRepository.findByPhoneNumberOrderByIdDesc(row.phoneNumber)
                .map { AdminSuspensionResponse.of(it, now) },
        )
    }

    companion object {

        const val MAX_PAGE_SIZE = 100
    }
}
