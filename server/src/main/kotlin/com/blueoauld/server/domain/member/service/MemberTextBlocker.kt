package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.TextTarget
import com.blueoauld.server.domain.member.repository.MemberRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class MemberTextBlocker(

    private val memberRepository: MemberRepository,
) {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun block(memberId: Long, target: TextTarget) {
        val member = memberRepository.findById(memberId).orElse(null) ?: return

        when (target) {
            TextTarget.COMMENT -> member.comment = Member.BLOCKED_TEXT
            TextTarget.BIO -> member.bio = Member.BLOCKED_TEXT
        }
    }
}
