package com.blueoauld.server.domain.point.web

import com.blueoauld.server.domain.point.dto.response.PointHistoryResponse
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import com.blueoauld.server.domain.point.entity.type.PointType
import com.blueoauld.server.domain.point.service.PointService
import com.blueoauld.server.global.response.CursorResponse
import io.swagger.v3.oas.annotations.Operation
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/points")
class PointController(

    private val pointService: PointService,
) {

    @Operation(summary = "접속 보상 받기")
    @PostMapping("/rewards/access")
    fun earnAccessReward(@AuthenticationPrincipal memberId: Long): PointRewardResponse =
        pointService.earn(memberId, PointType.ACCESS_REWARD)

    @Operation(summary = "출석 보상 받기")
    @PostMapping("/rewards/attendance")
    fun earnAttendanceReward(@AuthenticationPrincipal memberId: Long): PointRewardResponse =
        pointService.earn(memberId, PointType.ATTENDANCE_REWARD)

    @Operation(summary = "광고 보상 받기")
    @PostMapping("/rewards/ad")
    fun earnAdReward(@AuthenticationPrincipal memberId: Long): PointRewardResponse =
        pointService.earn(memberId, PointType.AD_REWARD)

    @Operation(summary = "포인트 잔액 조회")
    @GetMapping("/me")
    fun findBalance(@AuthenticationPrincipal memberId: Long) = pointService.findBalance(memberId)

    @Operation(summary = "포인트 내역 조회")
    @GetMapping("/me/histories")
    fun findHistories(
        @AuthenticationPrincipal memberId: Long,
        @RequestParam(required = false) cursor: Long?,
        @RequestParam(defaultValue = "$DEFAULT_PAGE_SIZE") size: Int,
    ): CursorResponse<PointHistoryResponse> = pointService.findHistories(memberId, cursor, size)

    companion object {

        private const val DEFAULT_PAGE_SIZE = 20
    }
}
