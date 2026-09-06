package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.projection.AppleAdsMetricsRow
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsCampaignResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsKeywordListResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsKeywordResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsMetricsResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsSearchTermListResponse
import com.blueoauld.server.domain.admin.dto.response.AdminAppleAdsSearchTermResponse
import com.blueoauld.server.domain.admin.repository.AppleAdsAdminRepository
import com.blueoauld.server.domain.appleads.repository.AppleAdsCampaignRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate

@Service
class AdminAppleAdsReportService(

    private val campaignRepository: AppleAdsCampaignRepository,
    private val appleAdsAdminRepository: AppleAdsAdminRepository,
) {

    @Transactional(readOnly = true)
    fun findCampaigns(): List<AdminAppleAdsCampaignResponse> =
        campaignRepository.findAll(Sort.by(Sort.Direction.DESC, ID)).map {
            AdminAppleAdsCampaignResponse(id = it.id, name = it.name, status = it.status, deleted = it.deleted)
        }

    @Transactional(readOnly = true)
    fun findKeywords(startDate: LocalDate, endDate: LocalDate, campaignId: Long?): AdminAppleAdsKeywordListResponse {
        validate(startDate, endDate)

        val rows = appleAdsAdminRepository.summarizeKeywords(startDate, endDate, campaignId)

        val items = rows.map {
            AdminAppleAdsKeywordResponse(
                keywordId = it.keywordId,
                keyword = it.keyword,
                matchType = it.matchType,
                keywordStatus = it.keywordStatus,
                bidAmount = it.bidAmount,
                campaignId = it.campaignId,
                adGroupId = it.adGroupId,
                adGroupName = it.adGroupName,
                metrics = metrics(it),
            )
        }

        return AdminAppleAdsKeywordListResponse(items = items, total = metrics(sum(rows)))
    }

    @Transactional(readOnly = true)
    fun findSearchTerms(
        startDate: LocalDate,
        endDate: LocalDate,
        campaignId: Long?,
        source: String?,
    ): AdminAppleAdsSearchTermListResponse {
        validate(startDate, endDate)

        val rows = appleAdsAdminRepository.summarizeSearchTerms(startDate, endDate, campaignId, source)

        val items = rows.map {
            AdminAppleAdsSearchTermResponse(
                searchTerm = it.searchTerm,
                searchTermSource = it.searchTermSource,
                countryOrRegion = it.countryOrRegion,
                keywordId = it.keywordId,
                keyword = it.keyword,
                matchType = it.matchType,
                campaignId = it.campaignId,
                adGroupId = it.adGroupId,
                adGroupName = it.adGroupName,
                metrics = metrics(it),
            )
        }

        return AdminAppleAdsSearchTermListResponse(items = items, total = metrics(sum(rows)))
    }

    private fun validate(startDate: LocalDate, endDate: LocalDate) {
        if (startDate.isAfter(endDate)) {
            throw BusinessException(ErrorCode.INVALID_REQUEST)
        }
    }

    private fun sum(rows: List<AppleAdsMetricsRow>) = Totals(
        impressions = rows.sumOf { it.impressions },
        taps = rows.sumOf { it.taps },
        totalInstalls = rows.sumOf { it.totalInstalls },
        tapInstalls = rows.sumOf { it.tapInstalls },
        viewInstalls = rows.sumOf { it.viewInstalls },
        totalNewDownloads = rows.sumOf { it.totalNewDownloads },
        totalRedownloads = rows.sumOf { it.totalRedownloads },
        spend = rows.fold(BigDecimal.ZERO) { acc, it -> acc + it.spend },
        currency = rows.firstNotNullOfOrNull { it.currency },
    )

    private data class Totals(
        override val impressions: Long,
        override val taps: Long,
        override val totalInstalls: Long,
        override val tapInstalls: Long,
        override val viewInstalls: Long,
        override val totalNewDownloads: Long,
        override val totalRedownloads: Long,
        override val spend: BigDecimal,
        override val currency: String?,
    ) : AppleAdsMetricsRow

    companion object {

        private const val ID = "id"
        private const val MONEY_SCALE = 2

        private fun metrics(row: AppleAdsMetricsRow) = AdminAppleAdsMetricsResponse(
            impressions = row.impressions,
            taps = row.taps,
            totalInstalls = row.totalInstalls,
            tapInstalls = row.tapInstalls,
            viewInstalls = row.viewInstalls,
            totalNewDownloads = row.totalNewDownloads,
            totalRedownloads = row.totalRedownloads,
            spend = row.spend.setScale(MONEY_SCALE, RoundingMode.HALF_UP),
            currency = row.currency,
            tapThroughRate = rate(row.taps, row.impressions),
            costPerTap = perUnit(row.spend, row.taps),
            costPerInstall = perUnit(row.spend, row.totalInstalls),
            conversionRate = rate(row.totalInstalls, row.taps),
        )

        private fun rate(numerator: Long, denominator: Long): Double? =
            if (denominator == 0L) null else numerator.toDouble() / denominator

        private fun perUnit(amount: BigDecimal, count: Long): BigDecimal? =
            if (count == 0L) null else amount.divide(BigDecimal.valueOf(count), MONEY_SCALE, RoundingMode.HALF_UP)
    }
}
