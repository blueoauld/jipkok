package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.storage.service.PhotoStorage
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId

@Service
class MemberSummaryService(

    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val photoStorage: PhotoStorage,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findSummaries(memberIds: List<Long>): List<MemberSummaryResponse> {
        if (memberIds.isEmpty()) {
            return emptyList()
        }

        val members = memberRepository.findAllById(memberIds).associateBy { it.id }
        val profileImageUrls = findProfileImageUrls(memberIds)

        return memberIds.mapNotNull { members[it] }
            .map { toSummary(it, profileImageUrls[it.id]) }
    }

    private fun findProfileImageUrls(memberIds: List<Long>) =
        memberPhotoRepository.findAllByMemberIdIn(memberIds)
            .filter { it.visibility == PhotoVisibility.PUBLIC }
            .groupBy { it.memberId }
            .mapValues { (_, photos) -> photoStorage.toPublicUrl(photos.minBy { it.displayOrder }.objectKey) }

    private fun toSummary(member: Member, profileImageUrl: String?) = MemberSummaryResponse(
        memberId = member.id,
        nickname = member.nickname,
        gender = member.gender,
        age = LocalDate.now(clock.withZone(KOREA)).year - member.birthYear,
        receivedLikeCount = member.receivedLikeCount,
        comment = member.visibleComment,
        profileImageUrl = profileImageUrl,
    )

    companion object {

        private val KOREA: ZoneId = ZoneId.of("Asia/Seoul")
    }
}
