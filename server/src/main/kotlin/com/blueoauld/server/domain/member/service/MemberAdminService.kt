package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.NicknameHistory
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.entity.type.ProfileTarget
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.domain.member.repository.getMember
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberAdminService(

    private val memberRepository: MemberRepository,
    private val nicknameHistoryRepository: NicknameHistoryRepository,
    private val memberPhotoService: MemberPhotoService,
) {

    @Transactional(readOnly = true)
    fun findNickname(memberId: Long): String = memberRepository.getMember(memberId).nickname

    @Transactional(readOnly = true)
    fun findNicknames(memberIds: Collection<Long>): Map<Long, String> {
        val ids = memberIds.distinct()

        if (ids.isEmpty()) {
            return emptyMap()
        }

        val found = memberRepository.findNicknamesByIdIn(ids).associate { it.id to it.nickname }

        return ids.associateWith { found[it] ?: UNKNOWN_NICKNAME }
    }

    @Transactional(readOnly = true)
    fun findPhotoUrls(memberId: Long): Map<PhotoVisibility, List<String>> =
        memberPhotoService.findPhotoUrls(memberId)

    @Transactional
    fun resetProfile(memberId: Long, target: ProfileTarget) {
        val member = memberRepository.getMember(memberId)

        when (target) {
            ProfileTarget.NICKNAME -> resetNickname(member)
            ProfileTarget.COMMENT -> member.comment = null
            ProfileTarget.BIO -> member.bio = null
            ProfileTarget.PUBLIC_PHOTO -> memberPhotoService.deleteByVisibility(memberId, PhotoVisibility.PUBLIC)
            ProfileTarget.SECRET_PHOTO -> memberPhotoService.deleteByVisibility(memberId, PhotoVisibility.SECRET)
        }
    }

    private fun resetNickname(member: Member) {
        member.nickname = Member.generateNickname()
        nicknameHistoryRepository.save(NicknameHistory(member.id, member.nickname))
    }

    companion object {

        private const val UNKNOWN_NICKNAME = "알 수 없음"
    }
}
