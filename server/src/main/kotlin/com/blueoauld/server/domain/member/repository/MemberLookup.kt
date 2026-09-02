package com.blueoauld.server.domain.member.repository

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode

fun MemberRepository.getMember(memberId: Long): Member = findById(memberId).orElseThrow {
    BusinessException(ErrorCode.MEMBER_NOT_FOUND)
}

fun MemberRepository.checkMember(memberId: Long) {
    if (!existsById(memberId)) {
        throw BusinessException(ErrorCode.MEMBER_NOT_FOUND)
    }
}
