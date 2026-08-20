package com.blueoauld.server.domain.ad.repository

import com.blueoauld.server.domain.ad.entity.AdReward
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface AdRewardRepository : JpaRepository<AdReward, Long> {

    fun existsByTransactionId(transactionId: String): Boolean

    fun countByPhoneNumberAndRewardedOn(phoneNumber: String, rewardedOn: LocalDate): Long

    @Modifying
    @Query("delete from AdReward r where r.rewardedOn < :threshold")
    fun deleteAllRewardedBefore(@Param("threshold") threshold: LocalDate): Int
}
