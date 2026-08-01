package com.blueoauld.server.domain.like.web

import com.blueoauld.server.domain.like.service.MemberLikeService
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/members/{memberId}/likes")
class MemberLikeController(

    private val memberLikeService: MemberLikeService,
) {

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun like(@AuthenticationPrincipal likerId: Long, @PathVariable memberId: Long) {
        memberLikeService.like(likerId, memberId)
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun cancel(@AuthenticationPrincipal likerId: Long, @PathVariable memberId: Long) {
        memberLikeService.cancel(likerId, memberId)
    }
}
