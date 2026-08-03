package com.blueoauld.server.domain.access.repository

import com.blueoauld.server.domain.access.entity.AccessReward
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface AccessRewardRepository : JpaRepository<AccessReward, Long> {

    fun existsByPhoneNumberAndAccessedOn(phoneNumber: String, accessedOn: LocalDate): Boolean
}
