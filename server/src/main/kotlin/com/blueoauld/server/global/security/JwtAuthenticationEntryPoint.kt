package com.blueoauld.server.global.security

import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.exception.ErrorResponse
import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper

private val log = KotlinLogging.logger {}

@Component
class JwtAuthenticationEntryPoint(

    private val objectMapper: ObjectMapper,
) : AuthenticationEntryPoint {

    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException,
    ) {
        val errorCode = ErrorCode.UNAUTHORIZED

        if (request.requestURI.startsWith(API_PATH_PREFIX)) {
            log.info { "${request.method} ${request.requestURI} ${errorCode.status.value()}" }
        }

        response.status = errorCode.status.value()
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.characterEncoding = Charsets.UTF_8.name()
        response.writer.write(objectMapper.writeValueAsString(ErrorResponse.from(errorCode)))
    }

    companion object {

        private const val API_PATH_PREFIX = "/api/"
    }
}
