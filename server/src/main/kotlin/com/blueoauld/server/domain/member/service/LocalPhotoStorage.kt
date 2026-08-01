package com.blueoauld.server.domain.member.service

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component

private val log = KotlinLogging.logger {}

@Component
class LocalPhotoStorage : PhotoStorage {

    override fun createUploadUrl(objectKey: String, contentType: String): String {
        log.info { "업로드 URL을 발급한다. objectKey=$objectKey, contentType=$contentType" }

        return "$BASE_URL/$objectKey"
    }

    companion object {

        private const val BASE_URL = "http://localhost:8080/local-upload"
    }
}
