package com.blueoauld.server.domain.block.dto.request

import com.blueoauld.server.domain.block.entity.ContactBlock
import com.blueoauld.server.domain.member.entity.Member
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class ContactBlockRequest(

    @field:Pattern(regexp = Member.PHONE_NUMBER_PATTERN, message = "휴대폰 번호가 올바르지 않습니다.")
    val phoneNumber: String,

    @field:Size(max = ContactBlock.MEMO_MAX_LENGTH, message = "메모는 30자 이하여야 합니다.")
    val memo: String? = null,
)
