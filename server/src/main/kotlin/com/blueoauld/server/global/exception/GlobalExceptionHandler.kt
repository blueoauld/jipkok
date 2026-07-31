package com.blueoauld.server.global.exception

import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(BusinessException::class)
    fun handleBusiness(exception: BusinessException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(exception.errorCode.status).body(ErrorResponse.from(exception.errorCode))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(exception: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val errorCode = ErrorCode.INVALID_REQUEST
        val message = exception.bindingResult.fieldErrors.firstOrNull()?.defaultMessage ?: errorCode.message

        return ResponseEntity.status(errorCode.status).body(ErrorResponse.of(errorCode, message))
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(exception: Exception): ResponseEntity<ErrorResponse> {
        val errorCode = ErrorCode.INTERNAL_ERROR
        log.error("처리하지 못한 예외가 발생했다.", exception)

        return ResponseEntity.status(errorCode.status).body(ErrorResponse.from(errorCode))
    }
}
