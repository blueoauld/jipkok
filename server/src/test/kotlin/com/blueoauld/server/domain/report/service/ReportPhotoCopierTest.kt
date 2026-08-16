package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.report.event.PhotoCopy
import com.blueoauld.server.domain.report.event.ReportPhotosCopiedEvent
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test

class ReportPhotoCopierTest {

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val reportPhotoCopier = ReportPhotoCopier(photoStorage)

    @Test
    fun `신고 시점 사진을 신고 경로로 복사한다`() {
        // given
        val event = ReportPhotosCopiedEvent(REPORT_ID, listOf(profilePhotoCopy(), chatPhotoCopy()))

        // when
        reportPhotoCopier.copyPhotos(event)

        // then
        verify { photoStorage.copy("members/2/a.jpg", "reports/snapshot/$REPORT_ID/a.jpg") }
        verify { photoStorage.copy("chats/2/b.jpg", "reports/snapshot/$REPORT_ID/b.jpg") }
    }

    @Test
    fun `한 장이 실패해도 나머지를 복사한다`() {
        // given
        every { photoStorage.copy("members/2/a.jpg", any()) } throws IllegalStateException("R2 오류")
        val event = ReportPhotosCopiedEvent(REPORT_ID, listOf(profilePhotoCopy(), chatPhotoCopy()))

        // when
        reportPhotoCopier.copyPhotos(event)

        // then
        verify { photoStorage.copy("chats/2/b.jpg", "reports/snapshot/$REPORT_ID/b.jpg") }
    }

    private fun profilePhotoCopy() = PhotoCopy("members/2/a.jpg", "reports/snapshot/$REPORT_ID/a.jpg")

    private fun chatPhotoCopy() = PhotoCopy("chats/2/b.jpg", "reports/snapshot/$REPORT_ID/b.jpg")

    companion object {

        private const val REPORT_ID = 100L
    }
}
