package com.blueoauld.server.global.storage.service

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.dto.PhotoUploadUrlResponse
import com.blueoauld.server.global.storage.entity.PhotoUpload
import com.blueoauld.server.global.storage.repository.PhotoUploadRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.util.*

@Service
class PhotoUploadService(

    private val photoUploadRepository: PhotoUploadRepository,
    private val photoStorage: PhotoStorage,
    private val clock: Clock,
) {

    @Transactional
    fun createUploadUrl(memberId: Long, keyPrefix: String, contentType: String): PhotoUploadUrlResponse {
        val extension = MEDIA_EXTENSIONS[contentType] ?: throw BusinessException(ErrorCode.UNSUPPORTED_IMAGE_TYPE)
        val objectKey = "$keyPrefix${UUID.randomUUID()}.$extension"

        photoUploadRepository.save(PhotoUpload(memberId, objectKey, clock.instant()))

        return PhotoUploadUrlResponse(photoStorage.createUploadUrl(objectKey, contentType), objectKey)
    }

    @Transactional
    fun confirm(objectKeys: List<String>) {
        if (objectKeys.isNotEmpty()) {
            photoUploadRepository.deleteAllByObjectKeyIn(objectKeys)
        }
    }

    companion object {

        private val MEDIA_EXTENSIONS = mapOf(
            "image/jpeg" to "jpg",
            "image/png" to "png",
            "image/webp" to "webp",
            "video/mp4" to "mp4",
        )
    }
}
