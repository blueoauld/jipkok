package com.blueoauld.server.global.exception

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.OptimisticLockingFailureException
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatusCode
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.context.request.WebRequest
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler

private val log = KotlinLogging.logger {}

@RestControllerAdvice
class GlobalExceptionHandler : ResponseEntityExceptionHandler() {

    @ExceptionHandler(BusinessException::class)
    fun handleBusiness(exception: BusinessException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(exception.errorCode.status).body(ErrorResponse.from(exception.errorCode))

    @ExceptionHandler(DataIntegrityViolationException::class)
    fun handleDataIntegrityViolation(exception: DataIntegrityViolationException): ResponseEntity<ErrorResponse> {
        val errorCode = ErrorCode.DUPLICATE_REQUEST
        log.warn(exception) { "데이터 무결성 제약을 위반했다." }

        return ResponseEntity.status(errorCode.status).body(ErrorResponse.from(errorCode))
    }

    @ExceptionHandler(OptimisticLockingFailureException::class)
    fun handleOptimisticLockingFailure(exception: OptimisticLockingFailureException): ResponseEntity<ErrorResponse> {
        val errorCode = ErrorCode.DUPLICATE_REQUEST
        log.warn(exception) { "다른 요청이 먼저 바꾼 데이터를 고치려 했다." }

        return ResponseEntity.status(errorCode.status).body(ErrorResponse.from(errorCode))
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(exception: Exception): ResponseEntity<ErrorResponse> {
        val errorCode = ErrorCode.INTERNAL_ERROR
        log.error(exception) { "처리하지 못한 예외가 발생했다." }

        return ResponseEntity.status(errorCode.status).body(ErrorResponse.from(errorCode))
    }

    override fun handleMethodArgumentNotValid(
        exception: MethodArgumentNotValidException,
        headers: HttpHeaders,
        status: HttpStatusCode,
        request: WebRequest,
    ): ResponseEntity<Any>? {
        val errorCode = ErrorCode.INVALID_REQUEST
        val message = exception.bindingResult.fieldErrors.firstOrNull()?.defaultMessage ?: errorCode.message

        return ResponseEntity.status(status).body(ErrorResponse.of(errorCode, message))
    }

    override fun handleExceptionInternal(
        exception: Exception,
        body: Any?,
        headers: HttpHeaders,
        statusCode: HttpStatusCode,
        request: WebRequest,
    ): ResponseEntity<Any>? {
        val errorCode = if (statusCode.is4xxClientError) ErrorCode.INVALID_REQUEST else ErrorCode.INTERNAL_ERROR

        if (!statusCode.is4xxClientError) {
            log.error(exception) { "요청을 처리하지 못했다." }
        }

        return ResponseEntity.status(statusCode).body(ErrorResponse.from(errorCode))
    }
}
