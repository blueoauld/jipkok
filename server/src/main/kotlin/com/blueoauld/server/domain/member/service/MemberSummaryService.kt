package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.projection.MemberListRow
import com.blueoauld.server.domain.member.dto.response.MemberListItemResponse
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.displayOrdered
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.memo.service.MemberMemoService
import com.blueoauld.server.global.storage.service.PhotoStorage
import com.blueoauld.server.global.time.ageOf
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class MemberSummaryService(

    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val memberMemoService: MemberMemoService,
    private val photoStorage: PhotoStorage,
    private val clock: Clock,
) {

    @Transactional(readOnly = true)
    fun findSummaries(viewerId: Long, memberIds: List<Long>): List<MemberSummaryResponse> {
        if (memberIds.isEmpty()) {
            return emptyList()
        }

        val members = memberRepository.findAllById(memberIds).associateBy { it.id }
        val profileImageUrls = findProfileImageUrls(memberIds)
        val memos = memberMemoService.findContents(viewerId, memberIds)

        return memberIds.mapNotNull { members[it] }
            .map { toSummary(it, profileImageUrls[it.id], memos[it.id]) }
    }

    @Transactional(readOnly = true)
    fun findListItems(viewerId: Long, rows: List<MemberListRow>): List<MemberListItemResponse> {
        val summaries = findSummaries(viewerId, rows.map { it.getMemberId() }).associateBy { it.memberId }

        return rows.mapNotNull { row ->
            summaries[row.getMemberId()]?.let {
                MemberListItemResponse.of(it, row.getLocatedAt(), row.getDistance(), row.getFavoritedByMe())
            }
        }
    }

    private fun findProfileImageUrls(memberIds: List<Long>) =
        memberPhotoRepository.findAllByMemberIdIn(memberIds)
            .displayOrdered(PhotoVisibility.PUBLIC)
            .groupBy { it.memberId }
            .mapValues { (_, photos) -> photoStorage.toPublicUrl(photos.first().objectKey) }

    private fun toSummary(member: Member, profileImageUrl: String?, memo: String?) = MemberSummaryResponse(
        memberId = member.id,
        nickname = member.nickname,
        gender = member.gender,
        age = clock.ageOf(member.birthYear),
        receivedLikeCount = member.receivedLikeCount,
        comment = member.comment,
        profileImageUrl = profileImageUrl,
        memo = memo,
    )
}
