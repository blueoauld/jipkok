package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsActionCommand
import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendation
import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendationResult
import com.blueoauld.server.domain.appleads.dto.AppleAdsRecommendationType
import com.blueoauld.server.domain.appleads.entity.AppleAdsAutomation
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import com.blueoauld.server.domain.appleads.repository.AppleAdsActionRepository
import com.blueoauld.server.domain.appleads.repository.AppleAdsAutomationRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.*

class AppleAdsAutomationServiceTest {

    private val automationRepository = mockk<AppleAdsAutomationRepository>()

    private val actionRepository = mockk<AppleAdsActionRepository>()

    private val recommender = mockk<AppleAdsRecommender>()

    private val actionService = mockk<AppleAdsActionService>()

    private val service = AppleAdsAutomationService(
        automationRepository,
        actionRepository,
        recommender,
        actionService,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    private val settings = AppleAdsAutomation(enabled = true, dailyLimit = 3)

    @BeforeEach
    fun setUp() {
        every { automationRepository.findById(AppleAdsAutomation.SINGLETON_ID) } returns Optional.of(settings)
        every { actionRepository.countByAutomaticTrueAndCreatedAtAfter(any()) } returns 0
        every { actionService.apply(null, any(), automatic = true) } returns mockk()
    }

    @Test
    fun `꺼져 있으면 추천도 보지 않는다`() {
        // given
        settings.enabled = false

        // when
        val result = service.run()

        // then
        assertThat(result.enabled).isFalse()
        assertThat(result.applied).isEqualTo(0)
        verify(exactly = 0) { recommender.recommend(any(), any(), any()) }
    }

    @Test
    fun `3일 전까지의 30일 창으로 추천을 받아 허용된 유형만 자동 적용한다`() {
        // given
        settings.addKeyword = false
        given(
            recommendation(AppleAdsRecommendationType.PAUSE_KEYWORD, keywordId = 1L),
            recommendation(AppleAdsRecommendationType.ADD_KEYWORD, searchTerm = "소개팅 앱"),
            recommendation(AppleAdsRecommendationType.LOWER_BID, keywordId = 2L),
        )

        // when
        val result = service.run()

        // then
        verify { recommender.recommend(LocalDate.of(2026, 8, 5), LocalDate.of(2026, 9, 3), null) }
        assertThat(result.candidates).isEqualTo(2)
        assertThat(result.applied).isEqualTo(2)
        val commands = mutableListOf<AppleAdsActionCommand>()
        verify(exactly = 2) { actionService.apply(null, capture(commands), automatic = true) }
        assertThat(
            commands.map {
            it.type
        },
        ).containsExactly(AppleAdsActionType.PAUSE_KEYWORD, AppleAdsActionType.LOWER_BID)
        assertThat(commands[0].keywordId).isEqualTo(1L)
        assertThat(commands[0].reason).isEqualTo("근거")
    }

    @Test
    fun `오늘 이미 자동 적용한 건수를 빼고 하루 한도까지만 적용한다`() {
        // given
        every { actionRepository.countByAutomaticTrueAndCreatedAtAfter(KST_START_OF_TODAY) } returns 2
        given(
            recommendation(AppleAdsRecommendationType.PAUSE_KEYWORD, keywordId = 1L),
            recommendation(AppleAdsRecommendationType.PAUSE_KEYWORD, keywordId = 2L),
        )

        // when
        val result = service.run()

        // then
        assertThat(result.candidates).isEqualTo(2)
        assertThat(result.applied).isEqualTo(1)
        verify(exactly = 1) { actionService.apply(null, any(), automatic = true) }
    }

    @Test
    fun `한 건이 실패해도 나머지는 계속 적용한다`() {
        // given
        given(
            recommendation(AppleAdsRecommendationType.PAUSE_KEYWORD, keywordId = 1L),
            recommendation(AppleAdsRecommendationType.PAUSE_KEYWORD, keywordId = 2L),
        )
        every { actionService.apply(null, match { it.keywordId == 1L }, automatic = true) } throws
            BusinessException(ErrorCode.APPLE_ADS_UNAVAILABLE)

        // when
        val result = service.run()

        // then
        assertThat(result.applied).isEqualTo(1)
        assertThat(result.failed).isEqualTo(1)
    }

    @Test
    fun `설정이 없으면 기본값으로 만든다`() {
        // given
        every { automationRepository.findById(AppleAdsAutomation.SINGLETON_ID) } returns Optional.empty()
        every { automationRepository.save(any()) } answers { firstArg() }

        // when
        val created = service.settings()

        // then
        assertThat(created.enabled).isFalse()
        assertThat(created.dailyLimit).isEqualTo(AppleAdsAutomation.DEFAULT_DAILY_LIMIT)
        assertThat(created.addKeyword).isFalse()
        assertThat(created.pauseKeyword).isTrue()
    }

    private fun given(vararg items: AppleAdsRecommendation) {
        every { recommender.recommend(any(), any(), null) } returns AppleAdsRecommendationResult(
            baselineCostPerInstall = null,
            baselineInstalls = 0,
            baselineSpend = BigDecimal.ZERO,
            currency = "USD",
            items = items.toList(),
        )
    }

    private fun recommendation(
        type: AppleAdsRecommendationType,
        keywordId: Long? = null,
        searchTerm: String? = null,
    ) = AppleAdsRecommendation(
        type = type,
        campaignId = 1000L,
        adGroupId = 10L,
        adGroupName = "Ad Group 1",
        keywordId = keywordId,
        keyword = keywordId?.let { "keyword $it" },
        matchType = keywordId?.let { "EXACT" },
        searchTerm = searchTerm,
        currentBid = BigDecimal("1.45"),
        suggestedBid = BigDecimal("1.23"),
        currency = "USD",
        impressions = 100,
        taps = 20,
        totalInstalls = 0,
        spend = BigDecimal("9.00"),
        costPerInstall = null,
        reason = "근거",
    )

    companion object {

        // UTC 6일 12시는 한국 6일 21시다.
        private val NOW: Instant = Instant.parse("2026-09-06T12:00:00Z")
        private val KST_START_OF_TODAY: Instant = Instant.parse("2026-09-05T15:00:00Z")
    }
}
