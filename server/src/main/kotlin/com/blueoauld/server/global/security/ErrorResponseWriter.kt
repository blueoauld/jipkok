package com.blueoauld.server.global.security

import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.exception.ErrorResponse
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import tools.jackson.databind.ObjectMapper

fun HttpServletResponse.writeErrorResponse(objectMapper: ObjectMapper, errorCode: ErrorCode) {
    status = errorCode.status.value()
    contentType = MediaType.APPLICATION_JSON_VALUE
    characterEncoding = Charsets.UTF_8.name()
    writer.write(objectMapper.writeValueAsString(ErrorResponse.from(errorCode)))
}
