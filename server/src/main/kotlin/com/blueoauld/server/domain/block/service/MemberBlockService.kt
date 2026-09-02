package com.blueoauld.server.domain.block.service

import com.blueoauld.server.domain.block.entity.MemberBlock
import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.chat.service.ChatRoomService
import com.blueoauld.server.domain.member.dto.response.MemberSummaryResponse
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.checkMember
import com.blueoauld.server.domain.member.service.MemberSummaryService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.response.CursorResponse
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberBlockService(

    private val memberBlockRepository: MemberBlockRepository,
    private val memberRepository: MemberRepository,
    private val memberSummaryService: MemberSummaryService,
    private val chatRoomService: ChatRoomService,
) {

    @Transactional
    fun block(blockerId: Long, blockedMemberId: Long) {
        if (blockerId == blockedMemberId) {
            throw BusinessException(ErrorCode.SELF_BLOCK)
        }

        memberRepository.checkMember(blockedMemberId)

        if (memberBlockRepository.existsByBlockerIdAndBlockedMemberId(blockerId, blockedMemberId)) {
            return
        }

        memberBlockRepository.saveAndFlush(MemberBlock(blockerId, blockedMemberId))
        chatRoomService.deleteBetween(blockerId, blockedMemberId)
    }

    @Transactional
    fun unblock(blockerId: Long, blockedMemberId: Long) {
        memberBlockRepository.deleteByBlockerIdAndBlockedMemberId(blockerId, blockedMemberId)
    }

    @Transactional(readOnly = true)
    fun findBlocked(blockerId: Long, cursor: Long?, size: Int): CursorResponse<MemberSummaryResponse> {
        val pageSize = CursorResponse.pageSize(size)
        val blocks = memberBlockRepository.findByBlockerIdAndIdLessThanOrderByIdDesc(
            blockerId,
            cursor ?: Long.MAX_VALUE,
            Limit.of(pageSize),
        )

        return CursorResponse(
            items = memberSummaryService.findSummaries(blockerId, blocks.map { it.blockedMemberId }),
            nextCursor = blocks.lastOrNull()?.id.takeIf { blocks.size == pageSize },
        )
    }
}
