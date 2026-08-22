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
        if (objectKeys.isEmpty()) {
            return
        }

        val uploads = photoUploadRepository.findAllByObjectKeyIn(objectKeys)

        uploads.forEach { validateUploaded(it.objectKey) }
        photoUploadRepository.deleteAll(uploads)
    }

    private fun validateUploaded(objectKey: String) {
        val stored = photoStorage.head(objectKey) ?: throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)

        if (stored.contentType?.startsWith(VIDEO_CONTENT_TYPE_PREFIX) == true) {
            return
        }

        if (stored.contentLength > PHOTO_MAX_BYTES) {
            photoStorage.delete(listOf(objectKey))
            throw BusinessException(ErrorCode.PHOTO_TOO_LARGE)
        }
    }

    companion object {

        const val PHOTO_MAX_BYTES = 10L * 1024 * 1024

        private const val VIDEO_CONTENT_TYPE_PREFIX = "video/"

        private val MEDIA_EXTENSIONS = mapOf(
            "image/jpeg" to "jpg",
            "image/png" to "png",
            "image/webp" to "webp",
            "video/mp4" to "mp4",
        )
    }
}
