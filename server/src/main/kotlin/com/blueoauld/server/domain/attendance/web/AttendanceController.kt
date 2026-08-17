package com.blueoauld.server.domain.attendance.web

import com.blueoauld.server.domain.attendance.service.AttendanceService
import com.blueoauld.server.domain.point.dto.response.PointRewardResponse
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/attendances")
class AttendanceController(

    private val attendanceService: AttendanceService,
) {

    @Operation(summary = "출석 체크")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun checkIn(@AuthenticationPrincipal memberId: Long): PointRewardResponse = attendanceService.checkIn(memberId)
}
