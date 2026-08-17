package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.repository.ChatMessageReactionRepository
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class ChatRoomCleanerTest {

    private val chatRoomRepository = mockk<ChatRoomRepository>(relaxed = true)

    private val chatRoomMemberRepository = mockk<ChatRoomMemberRepository>(relaxed = true)

    private val chatMessageRepository = mockk<ChatMessageRepository>(relaxed = true)

    private val chatMessageReactionRepository = mockk<ChatMessageReactionRepository>(relaxed = true)

    private val photoStorage = mockk<PhotoStorage>(relaxed = true)

    private val chatRoomCleaner = ChatRoomCleaner(
        chatRoomRepository,
        chatRoomMemberRepository,
        chatMessageRepository,
        chatMessageReactionRepository,
        photoStorage,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { chatRoomRepository.findIdsDeletedBefore(any()) } returns ROOM_IDS
        every { chatMessageRepository.findObjectKeysByRoomIdIn(ROOM_IDS) } returns emptyList()
    }

    @Test
    fun `보관 기간이 지난 방은 대화 내역까지 지운다`() {
        // when
        chatRoomCleaner.cleanUpLeftRooms()

        // then
        verify { chatRoomRepository.findIdsDeletedBefore(NOW.minus(ChatRoomCleaner.RETENTION)) }
        verify { chatMessageRepository.deleteByRoomIdIn(ROOM_IDS) }
        verify { chatRoomMemberRepository.deleteByRoomIdIn(ROOM_IDS) }
        verify { chatRoomRepository.deleteAllByIdIn(ROOM_IDS) }
    }

    @Test
    fun `주고받은 사진도 지운다`() {
        // given
        every { chatMessageRepository.findObjectKeysByRoomIdIn(ROOM_IDS) } returns OBJECT_KEYS

        // when
        chatRoomCleaner.cleanUpLeftRooms()

        // then
        verify { photoStorage.delete(OBJECT_KEYS) }
    }

    @Test
    fun `사진이 없으면 저장소를 건드리지 않는다`() {
        // when
        chatRoomCleaner.cleanUpLeftRooms()

        // then
        verify(exactly = 0) { photoStorage.delete(any()) }
    }

    @Test
    fun `지울 방이 없으면 아무것도 하지 않는다`() {
        // given
        every { chatRoomRepository.findIdsDeletedBefore(any()) } returns emptyList()

        // when
        chatRoomCleaner.cleanUpLeftRooms()

        // then
        verify(exactly = 0) { chatMessageRepository.deleteByRoomIdIn(any()) }
        verify(exactly = 0) { chatRoomRepository.deleteAllByIdIn(any()) }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-02T05:00:00Z")

        private val ROOM_IDS = listOf(10L, 11L)
        private val OBJECT_KEYS = listOf("chats/10/a.jpg", "chats/11/b.jpg")
    }
}
