package com.blueoauld.server.domain.appleads.entity

import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily.Companion.CURRENCY_LENGTH
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily.Companion.MONEY_PRECISION
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily.Companion.MONEY_SCALE
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily.Companion.NAME_MAX_LENGTH
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily.Companion.TYPE_MAX_LENGTH
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant

@Entity
@Table(
    name = "apple_ads_action",
    indexes = [Index(name = "idx_apple_ads_action_created_at", columnList = "created_at")],
)
class AppleAdsAction(

    @Column(name = "actor_id", updatable = false)
    val actorId: Long?,

    @Column(name = "automatic", nullable = false, updatable = false)
    val automatic: Boolean,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, updatable = false, length = TYPE_MAX_LENGTH)
    val type: AppleAdsActionType,

    @Column(name = "campaign_id", nullable = false, updatable = false)
    val campaignId: Long,

    @Column(name = "ad_group_id", nullable = false, updatable = false)
    val adGroupId: Long,

    @Column(name = "ad_group_name", updatable = false, length = NAME_MAX_LENGTH)
    val adGroupName: String?,

    @Column(name = "keyword_id", updatable = false)
    val keywordId: Long?,

    @Column(name = "keyword", updatable = false, length = NAME_MAX_LENGTH)
    val keyword: String?,

    @Column(name = "match_type", updatable = false, length = TYPE_MAX_LENGTH)
    val matchType: String?,

    @Column(name = "search_term", updatable = false, length = NAME_MAX_LENGTH)
    val searchTerm: String?,

    @Column(name = "negative_keyword_id", updatable = false)
    val negativeKeywordId: Long?,

    @Column(name = "previous_bid", updatable = false, precision = MONEY_PRECISION, scale = MONEY_SCALE)
    val previousBid: BigDecimal?,

    @Column(name = "new_bid", updatable = false, precision = MONEY_PRECISION, scale = MONEY_SCALE)
    val newBid: BigDecimal?,

    @Column(name = "currency", updatable = false, length = CURRENCY_LENGTH)
    val currency: String?,

    @Column(name = "previous_status", updatable = false, length = TYPE_MAX_LENGTH)
    val previousStatus: String?,

    @Column(name = "new_status", updatable = false, length = TYPE_MAX_LENGTH)
    val newStatus: String?,

    @Column(name = "reason", updatable = false, length = REASON_MAX_LENGTH)
    val reason: String?,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    @Column(name = "reverted_at")
    var revertedAt: Instant? = null
        protected set

    @Column(name = "reverted_by_id")
    var revertedById: Long? = null
        protected set

    val reverted: Boolean
        get() = revertedAt != null

    fun revert(actorId: Long, now: Instant) {
        revertedAt = now
        revertedById = actorId
    }

    companion object {

        const val REASON_MAX_LENGTH = 500
    }
}
