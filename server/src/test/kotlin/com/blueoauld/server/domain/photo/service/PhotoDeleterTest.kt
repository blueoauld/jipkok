package com.blueoauld.server.domain.photo.service

import com.blueoauld.server.domain.photo.event.PhotosDeletedEvent
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test

class PhotoDeleterTest {

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val photoDeleter = PhotoDeleter(photoStorage)

    @Test
    fun `삭제 이벤트를 받으면 저장소에서 지운다`() {
        // given
        val objectKeys = listOf("members/1/a.jpg", "members/1/b.jpg")

        // when
        photoDeleter.deletePhotos(PhotosDeletedEvent(objectKeys))

        // then
        verify { photoStorage.delete(objectKeys) }
    }

    @Test
    fun `저장소 삭제가 실패해도 예외를 밖으로 던지지 않는다`() {
        // given
        every { photoStorage.delete(any()) } throws IllegalStateException("R2 오류")

        // when
        photoDeleter.deletePhotos(PhotosDeletedEvent(listOf("members/1/a.jpg")))

        // then
        verify { photoStorage.delete(any()) }
    }
}
