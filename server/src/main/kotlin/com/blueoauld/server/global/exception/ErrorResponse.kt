package com.blueoauld.server.global.exception

data class ErrorResponse(

    val code: String,
    val message: String,
) {

    companion object {

        fun from(errorCode: ErrorCode) = ErrorResponse(errorCode.code, errorCode.message)

        fun of(errorCode: ErrorCode, message: String) = ErrorResponse(errorCode.code, message)
    }
}
