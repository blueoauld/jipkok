package com.blueoauld.server.global.storage.service

import com.blueoauld.server.global.storage.dto.StoredObject
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
@ConditionalOnProperty(prefix = "r2", name = ["enabled"], havingValue = "false", matchIfMissing = true)
class LocalPhotoStorage : PhotoStorage {

    override fun createUploadUrl(objectKey: String, contentType: String): String {
        log.info { "업로드 URL을 발급한다. objectKey=$objectKey, contentType=$contentType" }

        return "$BASE_URL/$objectKey"
    }

    override fun toPublicUrl(objectKey: String) = "$BASE_URL/$objectKey"

    override fun createSignedViewUrl(objectKey: String) = "$BASE_URL/$objectKey?signed=true"

    override fun createSignedViewUrl(objectKey: String, validity: Duration) = createSignedViewUrl(objectKey)

    override fun head(objectKey: String): StoredObject {
        log.info { "객체 정보를 읽는다. objectKey=$objectKey" }

        return StoredObject(contentLength = 0, contentType = null)
    }

    override fun copy(sourceKey: String, targetKey: String) {
        log.info { "사진을 복사한다. sourceKey=$sourceKey, targetKey=$targetKey" }
    }

    override fun delete(objectKeys: List<String>) {
        log.info { "사진을 삭제한다. objectKeys=$objectKeys" }
    }

    companion object {

        private const val BASE_URL = "http://localhost:8080/local-upload"
    }
}
