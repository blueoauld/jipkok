package com.blueoauld.server.domain.access.repository

import com.blueoauld.server.domain.access.entity.AccessReward
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface AccessRewardRepository : JpaRepository<AccessReward, Long> {

    fun existsByPhoneNumberAndAccessedOn(phoneNumber: String, accessedOn: LocalDate): Boolean

    @Modifying
    @Query("delete from AccessReward r where r.accessedOn < :threshold")
    fun deleteAllAccessedBefore(@Param("threshold") threshold: LocalDate): Int
}
