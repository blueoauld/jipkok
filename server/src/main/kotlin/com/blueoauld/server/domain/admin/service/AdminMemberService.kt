package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.AdminMemberStatus
import com.blueoauld.server.domain.admin.dto.request.ResetProfileRequest
import com.blueoauld.server.domain.admin.dto.response.AdminMemberDetailResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMemberPageResponse
import com.blueoauld.server.domain.admin.dto.response.AdminMemberResponse
import com.blueoauld.server.domain.admin.dto.response.AdminNicknameHistoryResponse
import com.blueoauld.server.domain.admin.dto.response.AdminSuspensionResponse
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.MemberAdminRepository
import com.blueoauld.server.domain.admin.repository.NicknameHistoryAdminRepository
import com.blueoauld.server.domain.admin.repository.SuspensionAdminRepository
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.service.MemberAdminService
import com.blueoauld.server.domain.member.service.MemberWithdrawService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.repository.escapeLike
import com.blueoauld.server.global.time.ageOf
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.util.concurrent.atomic.AtomicReference

@Service
class AdminMemberService(

    private val memberAdminRepository: MemberAdminRepository,
    private val suspensionAdminRepository: SuspensionAdminRepository,
    private val nicknameHistoryAdminRepository: NicknameHistoryAdminRepository,
    private val memberAdminService: MemberAdminService,
    private val memberWithdrawService: MemberWithdrawService,
    private val adminActionRecorder: AdminActionRecorder,
    private val clock: Clock,
) {

    private val totalCountCache = AtomicReference<CachedCount?>(null)

    @Transactional(readOnly = true)
    fun findMembers(
        status: AdminMemberStatus?,
        gender: Gender?,
        keyword: String?,
        page: Int,
        size: Int,
    ): AdminMemberPageResponse {
        val safePage = AdminPaging.page(page)
        val safeSize = AdminPaging.size(size)
        val now = clock.instant()

        val trimmed = keyword?.trim()?.takeIf { it.isNotEmpty() }
        val phoneDigits = trimmed?.let(::phoneDigitsOf)
        val keywordId = phoneDigits?.let { trimmed.takeIf { it.all(Char::isDigit) }?.toLongOrNull() ?: 0 }
        val phoneLike = phoneDigits?.let { "%$it%" }
        val nicknameLike = trimmed?.takeIf { phoneDigits == null }?.let { "%${it.escapeLike()}%" }

        val statusName = status?.name

        val rows = memberAdminRepository.findAllForAdmin(
            status = statusName,
            gender = gender?.name,
            keywordId = keywordId,
            phoneLike = phoneLike,
            nicknameLike = nicknameLike,
            now = now,
            size = safeSize,
            offset = AdminPaging.offset(safePage, safeSize),
        )
        val totalCount = countMembers(statusName, gender?.name, keywordId, phoneLike, nicknameLike, now)

        return AdminMemberPageResponse(
            items = rows.map {
                AdminMemberResponse(
                    id = it.id,
                    nickname = it.nickname,
                    gender = Gender.valueOf(it.gender),
                    age = clock.ageOf(it.birthYear),
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

    private fun countMembers(
        status: String?,
        gender: String?,
        keywordId: Long?,
        phoneLike: String?,
        nicknameLike: String?,
        now: Instant,
    ): Long {
        val filtered = status != null || gender != null || keywordId != null || nicknameLike != null

        if (filtered) {
            return memberAdminRepository.countForAdmin(status, gender, keywordId, phoneLike, nicknameLike, now)
        }

        totalCountCache.get()
            ?.takeIf { it.cachedAt.plus(TOTAL_COUNT_TTL).isAfter(now) }
            ?.let { return it.count }

        val count = memberAdminRepository.countForAdmin(null, null, null, null, null, now)
        totalCountCache.set(CachedCount(now, count))

        return count
    }

    @Transactional(readOnly = true)
    fun findDetail(memberId: Long): AdminMemberDetailResponse {
        val row = memberAdminRepository.findRowById(memberId)
            ?: throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        val now = clock.instant()
        val photoUrls = memberAdminService.findPhotoUrls(memberId)

        return AdminMemberDetailResponse(
            id = row.id,
            nickname = row.nickname,
            phoneNumber = row.phoneNumber,
            gender = Gender.valueOf(row.gender),
            age = clock.ageOf(row.birthYear),
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
            publicPhotoUrls = photoUrls[PhotoVisibility.PUBLIC].orEmpty(),
            secretPhotoUrls = photoUrls[PhotoVisibility.SECRET].orEmpty(),
            suspensions = suspensionAdminRepository.findByPhoneNumberOrderByIdDesc(row.phoneNumber)
                .map { AdminSuspensionResponse.of(it, now) },
            nicknameHistories = nicknameHistoryAdminRepository.findAllByMemberIdOrderByIdDesc(memberId)
                .map { AdminNicknameHistoryResponse(nickname = it.nickname, changedAt = it.createdAt) },
        )
    }

    @Transactional
    fun resetProfile(actorId: Long, memberId: Long, request: ResetProfileRequest) {
        memberAdminService.resetProfile(memberId, request.target!!)
        adminActionRecorder.record(
            actorId = actorId,
            action = AdminActionType.RESET_PROFILE,
            targetId = memberId,
            detail = request.target.name,
        )
    }

    @Transactional
    fun withdraw(actorId: Long, memberId: Long) {
        memberWithdrawService.withdraw(memberId)
        adminActionRecorder.record(
            actorId = actorId,
            action = AdminActionType.WITHDRAW_MEMBER,
            targetId = memberId,
        )
    }

    private fun phoneDigitsOf(keyword: String): String? {
        val compact = keyword.filterNot { it == PHONE_SEPARATOR || it.isWhitespace() }
        val digits = compact.removePrefix(INTERNATIONAL_PREFIX)

        if (digits.isEmpty() || !digits.all(Char::isDigit)) {
            return null
        }

        if (compact.startsWith(INTERNATIONAL_PREFIX)) {
            return digits
        }

        return digits.removePrefix(TRUNK_PREFIX).ifEmpty { digits }
    }

    private class CachedCount(val cachedAt: Instant, val count: Long)

    companion object {

        private val TOTAL_COUNT_TTL: Duration = Duration.ofMinutes(1)

        private const val PHONE_SEPARATOR = '-'
        private const val INTERNATIONAL_PREFIX = "+"
        private const val TRUNK_PREFIX = "0"
    }
}
