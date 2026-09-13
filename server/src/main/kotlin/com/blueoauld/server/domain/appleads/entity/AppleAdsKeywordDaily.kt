package com.blueoauld.server.domain.appleads.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(
    name = "apple_ads_keyword_daily",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_apple_ads_keyword_daily_keyword_id_report_date",
            columnNames = ["keyword_id", "report_date"],
        ),
    ],
    indexes = [
        Index(name = "idx_apple_ads_keyword_daily_campaign_id_report_date", columnList = "campaign_id, report_date"),
    ],
)
class AppleAdsKeywordDaily(

    @Column(name = "report_date", nullable = false, updatable = false)
    val reportDate: LocalDate,

    @Column(name = "campaign_id", nullable = false, updatable = false)
    val campaignId: Long,

    @Column(name = "ad_group_id", nullable = false)
    val adGroupId: Long,

    @Column(name = "ad_group_name", length = NAME_MAX_LENGTH)
    val adGroupName: String?,

    @Column(name = "keyword_id", nullable = false, updatable = false)
    val keywordId: Long,

    @Column(name = "keyword", nullable = false, length = NAME_MAX_LENGTH)
    val keyword: String,

    @Column(name = "match_type", length = TYPE_MAX_LENGTH)
    val matchType: String?,

    @Column(name = "keyword_status", length = TYPE_MAX_LENGTH)
    val keywordStatus: String?,

    @Column(name = "deleted", nullable = false)
    val deleted: Boolean,

    @Column(name = "bid_amount", precision = MONEY_PRECISION, scale = MONEY_SCALE)
    val bidAmount: BigDecimal?,

    @Column(name = "suggested_bid_amount", precision = MONEY_PRECISION, scale = MONEY_SCALE)
    val suggestedBidAmount: BigDecimal?,

    @Column(name = "bid_min", precision = MONEY_PRECISION, scale = MONEY_SCALE)
    val bidMin: BigDecimal?,

    @Column(name = "bid_max", precision = MONEY_PRECISION, scale = MONEY_SCALE)
    val bidMax: BigDecimal?,

    @Column(name = "currency", length = CURRENCY_LENGTH)
    val currency: String?,

    @Column(name = "impressions", nullable = false)
    val impressions: Long,

    @Column(name = "taps", nullable = false)
    val taps: Long,

    @Column(name = "total_installs", nullable = false)
    val totalInstalls: Long,

    @Column(name = "tap_installs", nullable = false)
    val tapInstalls: Long,

    @Column(name = "view_installs", nullable = false)
    val viewInstalls: Long,

    @Column(name = "total_new_downloads", nullable = false)
    val totalNewDownloads: Long,

    @Column(name = "total_redownloads", nullable = false)
    val totalRedownloads: Long,

    @Column(name = "spend", nullable = false, precision = MONEY_PRECISION, scale = MONEY_SCALE)
    val spend: BigDecimal,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val NAME_MAX_LENGTH = 200
        const val TYPE_MAX_LENGTH = 20
        const val CURRENCY_LENGTH = 3
        const val MONEY_PRECISION = 14
        const val MONEY_SCALE = 4
    }
}
