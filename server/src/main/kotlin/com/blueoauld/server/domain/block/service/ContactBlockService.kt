package com.blueoauld.server.domain.block.service

import com.blueoauld.server.domain.block.dto.response.ContactBlockResponse
import com.blueoauld.server.domain.block.entity.ContactBlock
import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ContactBlockService(

    private val contactBlockRepository: ContactBlockRepository,
    private val memberRepository: MemberRepository,
) {

    @Transactional
    fun add(memberId: Long, phoneNumber: String, memo: String?) {
        if (memberRepository.getMember(memberId).phoneNumber == phoneNumber) {
            throw BusinessException(ErrorCode.SELF_BLOCK)
        }

        if (contactBlockRepository.existsByMemberIdAndPhoneNumber(memberId, phoneNumber)) {
            return
        }

        if (contactBlockRepository.countByMemberId(memberId) >= ContactBlock.MAX_PER_MEMBER) {
            throw BusinessException(ErrorCode.CONTACT_BLOCK_LIMIT_EXCEEDED)
        }

        contactBlockRepository.saveAndFlush(ContactBlock(memberId, phoneNumber, memo?.trim()?.ifEmpty { null }))
    }

    @Transactional
    fun remove(memberId: Long, contactBlockId: Long) {
        contactBlockRepository.deleteByIdAndMemberId(contactBlockId, memberId)
    }

    @Transactional(readOnly = true)
    fun findAll(memberId: Long): List<ContactBlockResponse> = contactBlockRepository
        .findAllByMemberIdOrderByIdDesc(memberId)
        .map { ContactBlockResponse(it.id, it.phoneNumber, it.memo) }
}
