package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.time.currentYear
import java.time.Clock

data class BirthYearRange(

    val min: Int?,
    val max: Int?,
) {

    companion object {

        fun of(minAge: Int?, maxAge: Int?, clock: Clock): BirthYearRange {
            val lower = minAge ?: Member.MIN_AGE
            val upper = maxAge ?: Member.MAX_AGE

            if (lower !in Member.MIN_AGE..Member.MAX_AGE ||
                upper !in Member.MIN_AGE..Member.MAX_AGE ||
                lower > upper
            ) {
                throw BusinessException(ErrorCode.INVALID_AGE_RANGE)
            }

            val currentYear = clock.currentYear()

            return BirthYearRange(
                min = maxAge?.let { currentYear - it },
                max = minAge?.let { currentYear - it },
            )
        }
    }
}
