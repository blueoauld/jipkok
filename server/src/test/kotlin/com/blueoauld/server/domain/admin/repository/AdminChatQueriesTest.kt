package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.chat.entity.ChatRoom
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class AdminChatQueriesTest {

    @Autowired
    private lateinit var chatRoomAdminRepository: ChatRoomAdminRepository

    @Test
    fun `필터가 없으면 삭제된 방까지 마지막 메시지가 최근인 순으로 자른다`() {
        // given
        val older = saveRoom(ME_ID, 2L, lastMessageId = 10)
        val newest = saveRoom(5L, 6L, lastMessageId = 40)
        val middle = saveRoom(3L, ME_ID, lastMessageId = 30)
        chatRoomAdminRepository.deleteById(middle)
        chatRoomAdminRepository.flush()

        // when
        val firstPage = chatRoomAdminRepository.findAllForAdmin(null, null, 2, 0)
        val secondPage = chatRoomAdminRepository.findAllForAdmin(null, null, 2, 2)

        // then
        assertThat(firstPage.map { it.id }).containsExactly(newest, middle)
        assertThat(firstPage.map { it.deletedAt != null }).containsExactly(false, true)
        assertThat(secondPage.map { it.id }).containsExactly(older)
        assertThat(chatRoomAdminRepository.countForAdmin(null, null)).isEqualTo(3)
    }

    @Test
    fun `상태 필터가 활성과 삭제를 가른다`() {
        // given
        val active = saveRoom(ME_ID, 2L, lastMessageId = 10)
        val deleted = saveRoom(ME_ID, 3L, lastMessageId = 20)
        chatRoomAdminRepository.deleteById(deleted)
        chatRoomAdminRepository.flush()

        // when
        val activeRooms = chatRoomAdminRepository.findAllForAdmin("ACTIVE", null, 20, 0)
        val deletedRooms = chatRoomAdminRepository.findAllForAdmin("DELETED", null, 20, 0)

        // then
        assertThat(activeRooms.map { it.id }).containsExactly(active)
        assertThat(deletedRooms.map { it.id }).containsExactly(deleted)
        assertThat(chatRoomAdminRepository.countForAdmin("ACTIVE", null)).isEqualTo(1)
        assertThat(chatRoomAdminRepository.countForAdmin("DELETED", null)).isEqualTo(1)
    }

    @Test
    fun `회원 ID를 주면 그 회원이 어느 쪽이든 속한 방만 준다`() {
        // given
        val older = saveRoom(ME_ID, 2L, lastMessageId = 10)
        val newer = saveRoom(3L, ME_ID, lastMessageId = 30)
        saveRoom(5L, 6L, lastMessageId = 40)

        // when
        val rooms = chatRoomAdminRepository.findAllForAdmin(null, ME_ID, 20, 0)

        // then
        assertThat(rooms.map { it.id }).containsExactly(newer, older)
        assertThat(chatRoomAdminRepository.countForAdmin(null, ME_ID)).isEqualTo(2)
    }

    @Test
    fun `단건 조회는 삭제된 방도 삭제 시각과 함께 준다`() {
        // given
        val deleted = saveRoom(ME_ID, 2L, lastMessageId = 10)
        chatRoomAdminRepository.deleteById(deleted)
        chatRoomAdminRepository.flush()

        // when
        val row = chatRoomAdminRepository.findRowById(deleted)

        // then
        assertThat(row?.lowMemberId).isEqualTo(ME_ID)
        assertThat(row?.highMemberId).isEqualTo(2L)
        assertThat(row?.deletedAt).isNotNull()
        assertThat(chatRoomAdminRepository.findRowById(deleted + 1_000)).isNull()
    }

    private fun saveRoom(memberId: Long, partnerId: Long, lastMessageId: Long): Long {
        val room = ChatRoom.of(memberId, partnerId)
        room.lastMessageId = lastMessageId

        return chatRoomAdminRepository.saveAndFlush(room).id
    }

    companion object {

        private const val ME_ID = 1L
    }
}
