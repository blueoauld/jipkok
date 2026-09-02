package com.blueoauld.server.domain.memo.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.checkMember
import com.blueoauld.server.domain.memo.entity.MemberMemo
import com.blueoauld.server.domain.memo.repository.MemberMemoRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberMemoService(

    private val memberMemoRepository: MemberMemoRepository,
    private val memberRepository: MemberRepository,
) {

    @Transactional
    fun update(ownerId: Long, targetId: Long, content: String?) {
        if (ownerId == targetId) {
            throw BusinessException(ErrorCode.SELF_MEMO)
        }

        val trimmed = content?.trim().orEmpty()

        if (trimmed.isEmpty()) {
            memberMemoRepository.deleteByOwnerIdAndTargetId(ownerId, targetId)

            return
        }

        memberRepository.checkMember(targetId)

        val memo = memberMemoRepository.findByOwnerIdAndTargetId(ownerId, targetId)

        if (memo == null) {
            memberMemoRepository.save(MemberMemo(ownerId, targetId, trimmed))
        } else {
            memo.content = trimmed
        }
    }

    @Transactional(readOnly = true)
    fun findContent(ownerId: Long, targetId: Long): String? =
        memberMemoRepository.findByOwnerIdAndTargetId(ownerId, targetId)?.content

    @Transactional(readOnly = true)
    fun findContents(ownerId: Long, targetIds: Collection<Long>): Map<Long, String> {
        if (targetIds.isEmpty()) {
            return emptyMap()
        }

        return memberMemoRepository.findAllByOwnerIdAndTargetIdIn(ownerId, targetIds.distinct())
            .associate { it.targetId to it.content }
    }
}
