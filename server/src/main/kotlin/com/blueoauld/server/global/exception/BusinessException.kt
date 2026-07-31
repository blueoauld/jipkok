package com.blueoauld.server.global.exception

class BusinessException(val errorCode: ErrorCode) : RuntimeException(errorCode.message)
