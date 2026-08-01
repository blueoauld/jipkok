package com.blueoauld.server.global.storage

import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
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
    fun createUploadUrl(memberId: Long, keyPrefix: String, contentType: String): IssuedPhotoUpload {
        val extension = IMAGE_EXTENSIONS[contentType] ?: throw BusinessException(ErrorCode.UNSUPPORTED_IMAGE_TYPE)
        val objectKey = "$keyPrefix${UUID.randomUUID()}.$extension"

        photoUploadRepository.save(PhotoUpload(memberId, objectKey, clock.instant()))

        return IssuedPhotoUpload(photoStorage.createUploadUrl(objectKey, contentType), objectKey)
    }

    fun confirm(objectKeys: List<String>) {
        if (objectKeys.isNotEmpty()) {
            photoUploadRepository.deleteAllByObjectKeyIn(objectKeys)
        }
    }

    companion object {

        private val IMAGE_EXTENSIONS = mapOf(
            "image/jpeg" to "jpg",
            "image/png" to "png",
            "image/webp" to "webp",
        )
    }
}
