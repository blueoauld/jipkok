package com.blueoauld.server.domain.block.service

import com.blueoauld.server.domain.member.repository.MemberRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

private val log = KotlinLogging.logger {}

@Component
class PhoneHashBackfill(

    private val memberRepository: MemberRepository,
    private val phoneHasher: PhoneHasher,
) {

    @EventListener(ApplicationReadyEvent::class)
    @Transactional
    fun backfill() {
        var filled = 0

        while (true) {
            val count = fillBatch()

            if (count == 0) {
                break
            }

            filled += count
        }

        if (filled > 0) {
            log.info { "회원 ${filled}명의 전화번호 해시를 채웠다." }
        }
    }

    private fun fillBatch(): Int {
        val members = memberRepository.findAllByPhoneHashIsNull(Limit.of(BATCH_SIZE))

        members.forEach { it.phoneHash = phoneHasher.hash(it.phoneNumber) }

        return members.size
    }

    companion object {

        const val BATCH_SIZE = 500
    }
}
