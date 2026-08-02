package com.blueoauld.server.global.web

import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

@Component
class ServiceSuspensionInterceptor(

    private val memberSuspensionService: MemberSuspensionService,
) : HandlerInterceptor {

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        memberId()?.let { memberSuspensionService.check(it, SuspensionType.SERVICE) }

        return true
    }

    private fun memberId() = SecurityContextHolder.getContext().authentication?.principal as? Long
}
