package com.blueoauld.server.domain.appleads.entity

import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "apple_ads_automation")
class AppleAdsAutomation(

    @Column(name = "enabled", nullable = false)
    var enabled: Boolean = false,

    @Column(name = "daily_limit", nullable = false)
    var dailyLimit: Int = DEFAULT_DAILY_LIMIT,

    @Column(name = "auto_pause_keyword", nullable = false)
    var pauseKeyword: Boolean = true,

    @Column(name = "auto_add_negative_keyword", nullable = false)
    var addNegativeKeyword: Boolean = true,

    @Column(name = "auto_lower_bid", nullable = false)
    var lowerBid: Boolean = true,

    @Column(name = "auto_raise_bid", nullable = false)
    var raiseBid: Boolean = true,

    @Column(name = "auto_add_keyword", nullable = false)
    var addKeyword: Boolean = false,

    @Column(name = "updated_by_id")
    var updatedById: Long? = null,
) : BaseEntity() {

    @Id
    @Column(name = "id")
    val id: Long = SINGLETON_ID

    fun allows(type: AppleAdsActionType): Boolean = when (type) {
        AppleAdsActionType.PAUSE_KEYWORD -> pauseKeyword
        AppleAdsActionType.ADD_NEGATIVE_KEYWORD -> addNegativeKeyword
        AppleAdsActionType.LOWER_BID -> lowerBid
        AppleAdsActionType.RAISE_BID -> raiseBid
        AppleAdsActionType.ADD_KEYWORD -> addKeyword
    }

    fun update(
        enabled: Boolean,
        dailyLimit: Int,
        pauseKeyword: Boolean,
        addNegativeKeyword: Boolean,
        lowerBid: Boolean,
        raiseBid: Boolean,
        addKeyword: Boolean,
        updatedById: Long,
    ) {
        this.enabled = enabled
        this.dailyLimit = dailyLimit
        this.pauseKeyword = pauseKeyword
        this.addNegativeKeyword = addNegativeKeyword
        this.lowerBid = lowerBid
        this.raiseBid = raiseBid
        this.addKeyword = addKeyword
        this.updatedById = updatedById
    }

    companion object {

        const val SINGLETON_ID = 1L
        const val DEFAULT_DAILY_LIMIT = 5
        const val MAX_DAILY_LIMIT = 50
    }
}
