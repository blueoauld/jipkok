package com.blueoauld.server.domain.photo.service

import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.photo.entity.PhotoUpload
import com.blueoauld.server.domain.photo.repository.PhotoUploadRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.dto.StoredObject
import com.blueoauld.server.global.storage.service.PhotoStorage
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
    fun createUploadUrl(memberId: Long, keyPrefix: String, contentType: String): PhotoUploadUrlResponse =
        create(memberId, keyPrefix, contentType, IMAGE_EXTENSIONS)

    @Transactional
    fun createMediaUploadUrl(memberId: Long, keyPrefix: String, contentType: String): PhotoUploadUrlResponse =
        create(memberId, keyPrefix, contentType, MEDIA_EXTENSIONS)

    private fun create(
        memberId: Long,
        keyPrefix: String,
        contentType: String,
        extensions: Map<String, String>,
    ): PhotoUploadUrlResponse {
        val extension = extensions[contentType] ?: throw BusinessException(ErrorCode.UNSUPPORTED_IMAGE_TYPE)
        val objectKey = "$keyPrefix${UUID.randomUUID()}.$extension"

        photoUploadRepository.save(PhotoUpload(memberId, objectKey, clock.instant()))

        return PhotoUploadUrlResponse(photoStorage.createUploadUrl(objectKey, contentType), objectKey)
    }

    @Transactional
    fun confirm(objectKeys: List<String>): Map<String, StoredObject> {
        if (objectKeys.isEmpty()) {
            return emptyMap()
        }

        val uploads = photoUploadRepository.findAllByObjectKeyIn(objectKeys)
        val stored = uploads.associate { it.objectKey to validateUploaded(it.objectKey) }

        photoUploadRepository.deleteAll(uploads)

        return stored
    }

    private fun validateUploaded(objectKey: String): StoredObject {
        val stored = photoStorage.head(objectKey) ?: throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)

        val (maxBytes, errorCode) = if (stored.contentType?.startsWith(VIDEO_CONTENT_TYPE_PREFIX) == true) {
            VIDEO_MAX_BYTES to ErrorCode.VIDEO_TOO_LARGE
        } else {
            PHOTO_MAX_BYTES to ErrorCode.PHOTO_TOO_LARGE
        }

        if (stored.contentLength > maxBytes) {
            photoStorage.delete(listOf(objectKey))
            throw BusinessException(errorCode)
        }

        return stored
    }

    companion object {

        const val PHOTO_MAX_BYTES = 10L * 1024 * 1024
        const val VIDEO_MAX_BYTES = 150L * 1024 * 1024

        private const val VIDEO_CONTENT_TYPE_PREFIX = "video/"

        private val IMAGE_EXTENSIONS = mapOf(
            "image/jpeg" to "jpg",
            "image/png" to "png",
            "image/webp" to "webp",
        )

        private val MEDIA_EXTENSIONS = IMAGE_EXTENSIONS + ("video/mp4" to "mp4")
    }
}
