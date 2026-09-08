package com.blueoauld.server.domain.block.dto.request

import com.blueoauld.server.domain.member.entity.Member
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class ContactBlockRequest(

    @field:Size(max = MAX_PHONE_NUMBERS, message = "차단할 번호가 너무 많습니다.")
    val phoneNumbers: List<
        @Pattern(regexp = Member.PHONE_NUMBER_PATTERN, message = "휴대폰 번호가 올바르지 않습니다.")
        String,
        >,
) {

    companion object {

        const val MAX_PHONE_NUMBERS = 5000
    }
}
