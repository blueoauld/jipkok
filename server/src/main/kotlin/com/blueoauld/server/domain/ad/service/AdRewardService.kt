package com.blueoauld.server.domain.ad.service

import com.blueoauld.server.domain.ad.dto.request.AdRewardCallbackRequest
import com.blueoauld.server.domain.ad.entity.AdReward
import com.blueoauld.server.domain.ad.repository.AdRewardRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.time.today
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock

@Service
class AdRewardService(

    private val adRewardRepository: AdRewardRepository,
    private val memberRepository: MemberRepository,
    private val pointService: PointService,
    private val signatureVerifier: AdRewardSignatureVerifier,
    private val clock: Clock,
) {

    @Transactional
    fun reward(request: AdRewardCallbackRequest, queryString: String) {
        signatureVerifier.verify(queryString, request.keyId, request.signature)

        val userId = request.userId ?: return

        if (adRewardRepository.existsByTransactionId(request.transactionId)) {
            return
        }

        val member = memberRepository.findById(userId).orElseThrow {
            BusinessException(ErrorCode.MEMBER_NOT_FOUND)
        }
        val today = clock.today()

        if (adRewardRepository.countByPhoneNumberAndRewardedOn(member.phoneNumber, today) >= AdReward.DAILY_LIMIT) {
            return
        }

        adRewardRepository.saveAndFlush(
            AdReward(request.transactionId, member.phoneNumber, userId, today),
        )
        pointService.earn(userId, PointType.AD_REWARD)
    }
}
