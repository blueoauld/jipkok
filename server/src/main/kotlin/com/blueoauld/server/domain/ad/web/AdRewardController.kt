package com.blueoauld.server.domain.ad.web

import com.blueoauld.server.domain.ad.dto.request.AdRewardCallbackRequest
import com.blueoauld.server.domain.ad.service.AdRewardService
import io.swagger.v3.oas.annotations.Operation
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/ads")
class AdRewardController(

    private val adRewardService: AdRewardService,
) {

    @Operation(summary = "광고 보상 콜백")
    @GetMapping("/rewards/callback")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun reward(
        @RequestParam("user_id", required = false) userId: Long?,
        @RequestParam("transaction_id") transactionId: String,
        @RequestParam("key_id") keyId: String,
        @RequestParam("signature") signature: String,
        request: HttpServletRequest,
    ) {
        adRewardService.reward(
            AdRewardCallbackRequest(userId, transactionId, keyId, signature),
            request.queryString.orEmpty(),
        )
    }
}
