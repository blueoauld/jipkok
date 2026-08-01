package com.blueoauld.server.domain.ad.service

import com.blueoauld.server.domain.ad.dto.request.AdRewardCallbackRequest
import com.blueoauld.server.domain.ad.entity.AdReward
import com.blueoauld.server.domain.ad.repository.AdRewardRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.*

class AdRewardServiceTest {

    private val adRewardRepository = mockk<AdRewardRepository>(relaxed = true)

    private val memberRepository = mockk<MemberRepository>()

    private val pointService = mockk<PointService>(relaxed = true)

    private val signatureVerifier = mockk<AdRewardSignatureVerifier>(relaxed = true)

    private val adRewardService = AdRewardService(
        adRewardRepository,
        memberRepository,
        pointService,
        signatureVerifier,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { adRewardRepository.existsByTransactionId(any()) } returns false
        every { adRewardRepository.countByPhoneNumberAndRewardedOn(any(), any()) } returns 0
        every { adRewardRepository.saveAndFlush(any()) } answers { firstArg() }
        every { pointService.earn(any(), any()) } returns PointRewardResponse(true, 30, 130)
    }

    @Test
    fun `서명을 확인하고 보상을 지급한다`() {
        // given
        val saved = slot<AdReward>()

        // when
        adRewardService.reward(request(), QUERY_STRING)

        // then
        verify { signatureVerifier.verify(QUERY_STRING, KEY_ID, SIGNATURE) }
        verify { adRewardRepository.saveAndFlush(capture(saved)) }
        verify { pointService.earn(MEMBER_ID, PointType.AD_REWARD) }
        assertThat(saved.captured.transactionId).isEqualTo(TRANSACTION_ID)
        assertThat(saved.captured.phoneNumber).isEqualTo(PHONE_NUMBER)
        assertThat(saved.captured.rewardedOn).isEqualTo(LocalDate.of(2026, 8, 2))
    }

    @Test
    fun `서명이 올바르지 않으면 지급하지 않는다`() {
        // given
        every {
            signatureVerifier.verify(any(), any(), any())
        } throws BusinessException(ErrorCode.INVALID_AD_SIGNATURE)

        // when
        val exception = assertThrows(BusinessException::class.java) {
            adRewardService.reward(request(), QUERY_STRING)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_AD_SIGNATURE)
        verify(exactly = 0) { adRewardRepository.saveAndFlush(any()) }
        verify(exactly = 0) { pointService.earn(any(), any()) }
    }

    @Test
    fun `같은 거래 번호가 다시 오면 지급하지 않는다`() {
        // given
        every { adRewardRepository.existsByTransactionId(TRANSACTION_ID) } returns true

        // when
        adRewardService.reward(request(), QUERY_STRING)

        // then
        verify(exactly = 0) { adRewardRepository.saveAndFlush(any()) }
        verify(exactly = 0) { pointService.earn(any(), any()) }
    }

    @Test
    fun `같은 번호로 하루 다섯 번을 채우면 지급하지 않는다`() {
        // given
        every {
            adRewardRepository.countByPhoneNumberAndRewardedOn(PHONE_NUMBER, any())
        } returns AdReward.DAILY_LIMIT.toLong()

        // when
        adRewardService.reward(request(), QUERY_STRING)

        // then
        verify(exactly = 0) { adRewardRepository.saveAndFlush(any()) }
        verify(exactly = 0) { pointService.earn(any(), any()) }
    }

    @Test
    fun `네 번까지는 지급한다`() {
        // given
        every {
            adRewardRepository.countByPhoneNumberAndRewardedOn(PHONE_NUMBER, any())
        } returns AdReward.DAILY_LIMIT.toLong() - 1

        // when
        adRewardService.reward(request(), QUERY_STRING)

        // then
        verify { pointService.earn(MEMBER_ID, PointType.AD_REWARD) }
    }

    @Test
    fun `없는 회원이면 지급하지 않는다`() {
        // given
        every { memberRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            adRewardService.reward(request(), QUERY_STRING)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.MEMBER_NOT_FOUND)
        verify(exactly = 0) { adRewardRepository.saveAndFlush(any()) }
    }

    private fun request() = AdRewardCallbackRequest(MEMBER_ID, TRANSACTION_ID, KEY_ID, SIGNATURE)

    private fun member() = Member(
        phoneNumber = PHONE_NUMBER,
        password = "encoded-password",
        gender = Gender.MALE,
        nickname = "닉네임",
        birthYear = 1998,
    )

    companion object {

        private const val MEMBER_ID = 1L
        private const val PHONE_NUMBER = "01012345678"
        private const val TRANSACTION_ID = "transaction-id"
        private const val KEY_ID = "3335741209"
        private const val SIGNATURE = "signature"
        private const val QUERY_STRING =
            "ad_network=5450213213286189855&reward_amount=30&transaction_id=transaction-id" +
                    "&user_id=1&signature=signature&key_id=3335741209"

        private val NOW: Instant = Instant.parse("2026-08-01T16:00:00Z")
    }
}
