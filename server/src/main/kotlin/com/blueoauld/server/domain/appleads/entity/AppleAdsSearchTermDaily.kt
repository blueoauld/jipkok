package com.blueoauld.server.domain.appleads.entity

import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily.Companion.CURRENCY_LENGTH
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily.Companion.MONEY_PRECISION
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily.Companion.MONEY_SCALE
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily.Companion.NAME_MAX_LENGTH
import com.blueoauld.server.domain.appleads.entity.AppleAdsKeywordDaily.Companion.TYPE_MAX_LENGTH
import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(
    name = "apple_ads_search_term_daily",
    indexes = [
        Index(
            name = "idx_apple_ads_search_term_daily_campaign_id_report_date",
            columnList = "campaign_id, report_date",
        ),
    ],
)
class AppleAdsSearchTermDaily(

    @Column(name = "report_date", nullable = false, updatable = false)
    val reportDate: LocalDate,

    @Column(name = "campaign_id", nullable = false, updatable = false)
    val campaignId: Long,

    @Column(name = "ad_group_id", nullable = false, updatable = false)
    val adGroupId: Long,

    @Column(name = "ad_group_name", length = NAME_MAX_LENGTH)
    val adGroupName: String?,

    @Column(name = "keyword_id", updatable = false)
    val keywordId: Long?,

    @Column(name = "keyword", length = NAME_MAX_LENGTH)
    val keyword: String?,

    @Column(name = "match_type", length = TYPE_MAX_LENGTH)
    val matchType: String?,

    @Column(name = "search_term", nullable = false, updatable = false, length = NAME_MAX_LENGTH)
    val searchTerm: String,

    @Column(name = "search_term_source", length = TYPE_MAX_LENGTH)
    val searchTermSource: String?,

    @Column(name = "country_or_region", length = COUNTRY_MAX_LENGTH)
    val countryOrRegion: String?,

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

        const val COUNTRY_MAX_LENGTH = 10
    }
}
