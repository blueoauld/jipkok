package com.blueoauld.server.domain.ad.entity

import com.blueoauld.server.domain.member.entity.Member
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.LocalDate

@Entity
@Table(
    name = "ad_reward",
    indexes = [
        Index(name = "idx_ad_reward_phone_number_rewarded_on", columnList = "phone_number, rewarded_on"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_ad_reward_transaction_id", columnNames = ["transaction_id"]),
    ],
)
class AdReward(

    @Column(name = "transaction_id", nullable = false, updatable = false, length = TRANSACTION_ID_MAX_LENGTH)
    val transactionId: String,

    @Column(name = "phone_number", nullable = false, updatable = false, length = Member.PHONE_NUMBER_LENGTH)
    val phoneNumber: String,

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "rewarded_on", nullable = false, updatable = false)
    val rewardedOn: LocalDate,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val TRANSACTION_ID_MAX_LENGTH = 64
        const val DAILY_LIMIT = 5
    }
}
