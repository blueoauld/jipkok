package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.domain.member.entity.Member
import org.springframework.data.jpa.repository.JpaRepository

interface MemberRepository : JpaRepository<Member, Long> {

    fun existsByPhoneNumber(phoneNumber: String): Boolean
}
