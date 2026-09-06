package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsActionCommand
import com.blueoauld.server.domain.appleads.dto.AppleAdsKeywordInfo
import com.blueoauld.server.domain.appleads.dto.AppleAdsNegativeKeywordInfo
import com.blueoauld.server.domain.appleads.entity.AppleAdsAction
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import com.blueoauld.server.domain.appleads.repository.AppleAdsActionRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class AppleAdsActionServiceTest {

    private val appleAdsClient = mockk<AppleAdsClient>()

    private val actionRepository = mockk<AppleAdsActionRepository>()

    private val service = AppleAdsActionService(appleAdsClient, actionRepository, Clock.fixed(NOW, ZoneOffset.UTC))

    @BeforeEach
    fun setUp() {
        every { actionRepository.save(any()) } answers { firstArg() }
    }

    @Test
    fun `키워드를 일시정지하고 이전 상태를 남긴다`() {
        // given
        every { appleAdsClient.updateKeyword(CAMPAIGN_ID, AD_GROUP_ID, KEYWORD_ID, "PAUSED", null, null) } returns
            keywordInfo(status = "PAUSED")

        // when
        val action = service.apply(ACTOR_ID, command(AppleAdsActionType.PAUSE_KEYWORD, keywordId = KEYWORD_ID))

        // then
        assertThat(action.type).isEqualTo(AppleAdsActionType.PAUSE_KEYWORD)
        assertThat(action.keywordId).isEqualTo(KEYWORD_ID)
        assertThat(action.previousStatus).isEqualTo("ACTIVE")
        assertThat(action.newStatus).isEqualTo("PAUSED")
        assertThat(action.reason).isEqualTo("탭 20회 동안 설치가 없다.")
    }

    @Test
    fun `입찰가를 바꾸고 이전 값과 애플이 확정한 값을 남긴다`() {
        // given
        every {
            appleAdsClient.updateKeyword(CAMPAIGN_ID, AD_GROUP_ID, KEYWORD_ID, null, BigDecimal("1.23"), "USD")
        } returns
            keywordInfo(bid = "1.23")

        // when
        val action = service.apply(
            ACTOR_ID,
            command(AppleAdsActionType.LOWER_BID, keywordId = KEYWORD_ID, currentBid = "1.45", suggestedBid = "1.23"),
        )

        // then
        assertThat(action.previousBid).isEqualByComparingTo(BigDecimal("1.45"))
        assertThat(action.newBid).isEqualByComparingTo(BigDecimal("1.23"))
        assertThat(action.currency).isEqualTo("USD")
    }

    @Test
    fun `제외 키워드는 정확 일치로 만들고 ID를 남긴다`() {
        // given
        every { appleAdsClient.createNegativeKeyword(CAMPAIGN_ID, AD_GROUP_ID, "디스코드", "EXACT") } returns
            AppleAdsNegativeKeywordInfo(
                id = NEGATIVE_KEYWORD_ID,
                adGroupId = AD_GROUP_ID,
                text = "디스코드",
                matchType = "EXACT",
                status = "ACTIVE",
            )

        // when
        val action = service.apply(ACTOR_ID, command(AppleAdsActionType.ADD_NEGATIVE_KEYWORD, searchTerm = " 디스코드 "))

        // then
        assertThat(action.negativeKeywordId).isEqualTo(NEGATIVE_KEYWORD_ID)
        assertThat(action.searchTerm).isEqualTo("디스코드")
        assertThat(action.matchType).isEqualTo("EXACT")
    }

    @Test
    fun `키워드 추가는 만들어진 키워드 ID와 입찰가를 남긴다`() {
        // given
        every {
            appleAdsClient.createKeyword(CAMPAIGN_ID, AD_GROUP_ID, "소개팅 앱", "EXACT", BigDecimal("1.45"), "USD")
        } returns
            keywordInfo(id = NEW_KEYWORD_ID, text = "소개팅 앱", bid = "1.45", status = "ACTIVE")

        // when
        val action = service.apply(
            ACTOR_ID,
            command(AppleAdsActionType.ADD_KEYWORD, searchTerm = "소개팅 앱", suggestedBid = "1.45"),
        )

        // then
        assertThat(action.keywordId).isEqualTo(NEW_KEYWORD_ID)
        assertThat(action.keyword).isEqualTo("소개팅 앱")
        assertThat(action.searchTerm).isEqualTo("소개팅 앱")
        assertThat(action.newBid).isEqualByComparingTo(BigDecimal("1.45"))
        assertThat(action.newStatus).isEqualTo("ACTIVE")
    }

    @Test
    fun `필수 값이 빠지면 애플을 부르지 않는다`() {
        // given

        // when
        val exception = assertThrows(BusinessException::class.java) {
            service.apply(ACTOR_ID, command(AppleAdsActionType.RAISE_BID, keywordId = KEYWORD_ID, suggestedBid = null))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_REQUEST)
        verify(exactly = 0) { appleAdsClient.updateKeyword(any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `일시정지를 되돌리면 이전 상태로 바꾸고 되돌린 사람과 시각을 남긴다`() {
        // given
        val action = savedAction(AppleAdsActionType.PAUSE_KEYWORD, keywordId = KEYWORD_ID, previousStatus = "ACTIVE")
        every { actionRepository.findById(ACTION_ID) } returns Optional.of(action)
        every { appleAdsClient.updateKeyword(CAMPAIGN_ID, AD_GROUP_ID, KEYWORD_ID, "ACTIVE", null, null) } returns
            keywordInfo(status = "ACTIVE")

        // when
        val reverted = service.revert(REVERTER_ID, ACTION_ID)

        // then
        assertThat(reverted.reverted).isTrue()
        assertThat(reverted.revertedAt).isEqualTo(NOW)
        assertThat(reverted.revertedById).isEqualTo(REVERTER_ID)
    }

    @Test
    fun `입찰가 변경을 되돌리면 이전 입찰가로 돌린다`() {
        // given
        val action = savedAction(
            AppleAdsActionType.RAISE_BID,
            keywordId = KEYWORD_ID,
            previousBid = "1.45",
            newBid = "1.67",
        )
        every { actionRepository.findById(ACTION_ID) } returns Optional.of(action)
        every {
            appleAdsClient.updateKeyword(CAMPAIGN_ID, AD_GROUP_ID, KEYWORD_ID, null, BigDecimal("1.45"), "USD")
        } returns
            keywordInfo(bid = "1.45")

        // when
        service.revert(REVERTER_ID, ACTION_ID)

        // then
        verify { appleAdsClient.updateKeyword(CAMPAIGN_ID, AD_GROUP_ID, KEYWORD_ID, null, BigDecimal("1.45"), "USD") }
    }

    @Test
    fun `제외 키워드와 추가한 키워드를 되돌리면 지운다`() {
        // given
        val negative = savedAction(AppleAdsActionType.ADD_NEGATIVE_KEYWORD, negativeKeywordId = NEGATIVE_KEYWORD_ID)
        val added = savedAction(AppleAdsActionType.ADD_KEYWORD, keywordId = NEW_KEYWORD_ID)
        every { actionRepository.findById(ACTION_ID) } returns Optional.of(negative)
        every { actionRepository.findById(OTHER_ACTION_ID) } returns Optional.of(added)
        justRun { appleAdsClient.deleteNegativeKeyword(CAMPAIGN_ID, AD_GROUP_ID, NEGATIVE_KEYWORD_ID) }
        justRun { appleAdsClient.deleteKeyword(CAMPAIGN_ID, AD_GROUP_ID, NEW_KEYWORD_ID) }

        // when
        service.revert(REVERTER_ID, ACTION_ID)
        service.revert(REVERTER_ID, OTHER_ACTION_ID)

        // then
        verify { appleAdsClient.deleteNegativeKeyword(CAMPAIGN_ID, AD_GROUP_ID, NEGATIVE_KEYWORD_ID) }
        verify { appleAdsClient.deleteKeyword(CAMPAIGN_ID, AD_GROUP_ID, NEW_KEYWORD_ID) }
    }

    @Test
    fun `이미 되돌린 조치는 다시 되돌리지 못한다`() {
        // given
        val action = savedAction(AppleAdsActionType.PAUSE_KEYWORD, keywordId = KEYWORD_ID, previousStatus = "ACTIVE")
        action.revert(REVERTER_ID, NOW)
        every { actionRepository.findById(ACTION_ID) } returns Optional.of(action)

        // when
        val exception = assertThrows(BusinessException::class.java) { service.revert(REVERTER_ID, ACTION_ID) }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.APPLE_ADS_ACTION_ALREADY_REVERTED)
    }

    @Test
    fun `없는 조치는 되돌리지 못한다`() {
        // given
        every { actionRepository.findById(ACTION_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) { service.revert(REVERTER_ID, ACTION_ID) }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.APPLE_ADS_ACTION_NOT_FOUND)
    }

    private fun command(
        type: AppleAdsActionType,
        keywordId: Long? = null,
        searchTerm: String? = null,
        currentBid: String? = null,
        suggestedBid: String? = null,
    ) = AppleAdsActionCommand(
        type = type,
        campaignId = CAMPAIGN_ID,
        adGroupId = AD_GROUP_ID,
        adGroupName = "Ad Group 1",
        keywordId = keywordId,
        keyword = keywordId?.let { "dating app" },
        matchType = keywordId?.let { "EXACT" },
        searchTerm = searchTerm,
        currentBid = currentBid?.let { BigDecimal(it) },
        suggestedBid = suggestedBid?.let { BigDecimal(it) },
        currency = "USD",
        reason = "탭 20회 동안 설치가 없다.",
    )

    private fun savedAction(
        type: AppleAdsActionType,
        keywordId: Long? = null,
        negativeKeywordId: Long? = null,
        previousBid: String? = null,
        newBid: String? = null,
        previousStatus: String? = null,
    ) = AppleAdsAction(
        actorId = ACTOR_ID,
        type = type,
        campaignId = CAMPAIGN_ID,
        adGroupId = AD_GROUP_ID,
        adGroupName = "Ad Group 1",
        keywordId = keywordId,
        keyword = keywordId?.let { "dating app" },
        matchType = "EXACT",
        searchTerm = negativeKeywordId?.let { "디스코드" },
        negativeKeywordId = negativeKeywordId,
        previousBid = previousBid?.let { BigDecimal(it) },
        newBid = newBid?.let { BigDecimal(it) },
        currency = "USD",
        previousStatus = previousStatus,
        newStatus = null,
        reason = null,
    )

    private fun keywordInfo(
        id: Long = KEYWORD_ID,
        text: String = "dating app",
        status: String? = "ACTIVE",
        bid: String? = "1.45",
    ) = AppleAdsKeywordInfo(
        id = id,
        adGroupId = AD_GROUP_ID,
        text = text,
        matchType = "EXACT",
        status = status,
        bidAmount = bid?.let { BigDecimal(it) },
        currency = "USD",
    )

    companion object {

        private const val ACTOR_ID = 1L
        private const val REVERTER_ID = 2L
        private const val CAMPAIGN_ID = 1000L
        private const val AD_GROUP_ID = 10L
        private const val KEYWORD_ID = 500L
        private const val NEW_KEYWORD_ID = 501L
        private const val NEGATIVE_KEYWORD_ID = 600L
        private const val ACTION_ID = 7L
        private const val OTHER_ACTION_ID = 8L

        private val NOW: Instant = Instant.parse("2026-09-06T12:00:00Z")
    }
}
