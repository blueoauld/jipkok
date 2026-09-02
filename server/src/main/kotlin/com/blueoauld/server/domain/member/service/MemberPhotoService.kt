package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.dto.response.ProfilePhotoResponse
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.displayOrdered
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.photo.dto.response.PhotoUploadUrlResponse
import com.blueoauld.server.domain.photo.event.PhotosDeletedEvent
import com.blueoauld.server.domain.photo.service.PhotoUploadService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.storage.service.PhotoStorage
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberPhotoService(

    private val memberPhotoRepository: MemberPhotoRepository,
    private val photoUploadService: PhotoUploadService,
    private val photoStorage: PhotoStorage,
    private val eventPublisher: ApplicationEventPublisher,
) {

    @Transactional
    fun replace(memberId: Long, publicPhotoKeys: List<String>, secretPhotoKeys: List<String>) {
        validateKeys(memberId, publicPhotoKeys, secretPhotoKeys)

        val keptKeys = publicPhotoKeys + secretPhotoKeys
        val removedKeys = memberPhotoRepository.findAllByMemberId(memberId)
            .map { it.objectKey }
            .filterNot { it in keptKeys }

        memberPhotoRepository.deleteAllByMemberId(memberId)
        memberPhotoRepository.flush()
        memberPhotoRepository.saveAll(
            toPhotos(memberId, publicPhotoKeys, PhotoVisibility.PUBLIC) +
                toPhotos(memberId, secretPhotoKeys, PhotoVisibility.SECRET),
        )
        photoUploadService.confirm(keptKeys)

        publishDeleted(removedKeys)
    }

    @Transactional
    fun deleteByVisibility(memberId: Long, visibility: PhotoVisibility) {
        val photos = memberPhotoRepository.findAllByMemberId(memberId).displayOrdered(visibility)

        if (photos.isEmpty()) {
            return
        }

        memberPhotoRepository.deleteAll(photos)
        publishDeleted(photos.map { it.objectKey })
    }

    fun createUploadUrl(memberId: Long, visibility: PhotoVisibility, contentType: String): PhotoUploadUrlResponse =
        photoUploadService.createUploadUrl(memberId, keyPrefix(memberId, visibility), contentType)

    @Transactional(readOnly = true)
    fun findProfilePhotos(memberId: Long): Map<PhotoVisibility, List<ProfilePhotoResponse>> {
        val photos = memberPhotoRepository.findAllByMemberId(memberId)

        return PhotoVisibility.entries.associateWith { visibility ->
            photos.displayOrdered(visibility).map {
                ProfilePhotoResponse(it.objectKey, viewUrl(visibility, it.objectKey))
            }
        }
    }

    @Transactional(readOnly = true)
    fun findPhotoUrls(memberId: Long): Map<PhotoVisibility, List<String>> {
        val photos = memberPhotoRepository.findAllByMemberId(memberId)

        return PhotoVisibility.entries.associateWith { visibility ->
            photos.displayOrdered(visibility).map { viewUrl(visibility, it.objectKey) }
        }
    }

    private fun validateKeys(memberId: Long, publicPhotoKeys: List<String>, secretPhotoKeys: List<String>) {
        val objectKeys = publicPhotoKeys + secretPhotoKeys

        if (objectKeys.size != objectKeys.toSet().size) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }

        validateKeyPrefix(memberId, publicPhotoKeys, PhotoVisibility.PUBLIC)
        validateKeyPrefix(memberId, secretPhotoKeys, PhotoVisibility.SECRET)
    }

    private fun validateKeyPrefix(memberId: Long, objectKeys: List<String>, visibility: PhotoVisibility) {
        val prefix = keyPrefix(memberId, visibility)

        if (objectKeys.any { !it.startsWith(prefix) }) {
            throw BusinessException(ErrorCode.INVALID_PHOTO_KEY)
        }
    }

    private fun toPhotos(memberId: Long, objectKeys: List<String>, visibility: PhotoVisibility) =
        objectKeys.mapIndexed { index, objectKey -> MemberPhoto(memberId, visibility, index, objectKey) }

    private fun viewUrl(visibility: PhotoVisibility, objectKey: String) =
        if (visibility == PhotoVisibility.PUBLIC) {
            photoStorage.toPublicUrl(objectKey)
        } else {
            photoStorage.createSignedViewUrl(objectKey)
        }

    private fun publishDeleted(objectKeys: List<String>) {
        if (objectKeys.isNotEmpty()) {
            eventPublisher.publishEvent(PhotosDeletedEvent(objectKeys))
        }
    }

    private fun keyPrefix(memberId: Long, visibility: PhotoVisibility) =
        "$KEY_ROOT/$memberId/${visibility.name.lowercase()}/"

    companion object {

        private const val KEY_ROOT = "members"
    }
}
