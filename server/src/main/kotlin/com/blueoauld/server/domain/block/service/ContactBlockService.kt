package com.blueoauld.server.domain.block.service

import com.blueoauld.server.domain.block.entity.ContactBlock
import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ContactBlockService(

    private val contactBlockRepository: ContactBlockRepository,
    private val phoneHasher: PhoneHasher,
) {

    @Transactional
    fun replace(memberId: Long, phoneNumbers: Collection<String>) {
        contactBlockRepository.deleteAllByMemberId(memberId)
        contactBlockRepository.saveAll(
            phoneNumbers.map(phoneHasher::hash).distinct().map { ContactBlock(memberId, it) },
        )
    }

    @Transactional
    fun clear(memberId: Long) {
        contactBlockRepository.deleteAllByMemberId(memberId)
    }

    @Transactional(readOnly = true)
    fun count(memberId: Long): Long = contactBlockRepository.countByMemberId(memberId)
}
