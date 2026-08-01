package com.blueoauld.server.domain.ad.repository

import com.blueoauld.server.domain.ad.entity.AdReward
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface AdRewardRepository : JpaRepository<AdReward, Long> {

    fun existsByTransactionId(transactionId: String): Boolean

    fun countByPhoneNumberAndRewardedOn(phoneNumber: String, rewardedOn: LocalDate): Long
}
