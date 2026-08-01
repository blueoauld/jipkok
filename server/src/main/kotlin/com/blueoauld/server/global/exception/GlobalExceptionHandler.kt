package com.blueoauld.server.global.exception

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

private val log = KotlinLogging.logger {}

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException::class)
    fun handleBusiness(exception: BusinessException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(exception.errorCode.status).body(ErrorResponse.from(exception.errorCode))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(exception: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val errorCode = ErrorCode.INVALID_REQUEST
        val message = exception.bindingResult.fieldErrors.firstOrNull()?.defaultMessage ?: errorCode.message

        return ResponseEntity.status(errorCode.status).body(ErrorResponse.of(errorCode, message))
    }

    @ExceptionHandler(DataIntegrityViolationException::class)
    fun handleDataIntegrityViolation(exception: DataIntegrityViolationException): ResponseEntity<ErrorResponse> {
        val errorCode = ErrorCode.DUPLICATE_REQUEST
        log.warn(exception) { "데이터 무결성 제약을 위반했다." }

        return ResponseEntity.status(errorCode.status).body(ErrorResponse.from(errorCode))
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(exception: Exception): ResponseEntity<ErrorResponse> {
        val errorCode = ErrorCode.INTERNAL_ERROR
        log.error(exception) { "처리하지 못한 예외가 발생했다." }

        return ResponseEntity.status(errorCode.status).body(ErrorResponse.from(errorCode))
    }
}
