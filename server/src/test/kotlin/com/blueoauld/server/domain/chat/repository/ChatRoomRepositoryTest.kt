package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.data.domain.Limit
import org.springframework.transaction.annotation.Transactional

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class ChatRoomRepositoryTest {

    @Autowired
    private lateinit var chatRoomRepository: ChatRoomRepository

    @Autowired
    private lateinit var chatRoomMemberRepository: ChatRoomMemberRepository

    @Autowired
    private lateinit var chatMessageRepository: ChatMessageRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    @Test
    fun `여러 방을 한 번에 소프트 딜리트한다`() {
        // given
        val first = chatRoomRepository.save(ChatRoom.of(1L, 2L))
        val second = chatRoomRepository.save(ChatRoom.of(1L, 3L))
        val untouched = chatRoomRepository.save(ChatRoom.of(1L, 4L))

        // when
        chatRoomRepository.softDeleteAllByIdIn(listOf(first.id, second.id))

        // then
        assertThat(chatRoomRepository.findById(first.id)).isEmpty()
        assertThat(chatRoomRepository.findById(second.id)).isEmpty()
        assertThat(chatRoomRepository.findById(untouched.id)).isPresent()
        assertThat(deletedCount(listOf(first.id, second.id))).isEqualTo(2L)
    }

    @Test
    fun `방 목록은 방 멤버가 들고 있는 마지막 메시지 순으로 준다`() {
        // given
        val older = saveRoom(partnerId = 2L)
        val newer = saveRoom(partnerId = 3L)

        // when
        val rows = chatRoomRepository.findRooms(
            memberId = ME_ID,
            minUnreadCount = 0,
            cursor = Long.MAX_VALUE,
            limit = Limit.of(PAGE_SIZE),
        )

        // then
        assertThat(rows.map { it.getRoomId() }).containsExactly(newer, older)
    }

    @Test
    fun `커서는 방 멤버의 마지막 메시지를 따른다`() {
        // given
        saveRoom(partnerId = 2L)
        val newer = saveRoom(partnerId = 3L)
        val cursor = chatRoomMemberRepository
            .findByRoomIdAndMemberId(newer, ME_ID)!!
            .lastMessageId

        // when
        val rows = chatRoomRepository.findRooms(
            memberId = ME_ID,
            minUnreadCount = 0,
            cursor = cursor,
            limit = Limit.of(PAGE_SIZE),
        )

        // then
        assertThat(rows.map { it.getRoomId() }).doesNotContain(newer)
    }

    @Test
    fun `메시지를 보내면 두 사람의 마지막 메시지가 함께 바뀌고 상대만 안읽음이 오른다`() {
        // given
        val roomId = saveRoom(partnerId = 2L)
        val message = chatMessageRepository.saveAndFlush(
            ChatMessage(roomId = roomId, senderId = ME_ID, type = ChatMessageType.TEXT, content = "안녕"),
        )

        // when
        chatRoomMemberRepository.applyLastMessage(roomId, message.id, 2L)

        // then
        val mine = chatRoomMemberRepository.findByRoomIdAndMemberId(roomId, ME_ID)!!
        val partner = chatRoomMemberRepository.findByRoomIdAndMemberId(roomId, 2L)!!
        assertThat(mine.lastMessageId).isEqualTo(message.id)
        assertThat(partner.lastMessageId).isEqualTo(message.id)
        assertThat(mine.unreadCount).isZero()
        assertThat(partner.unreadCount).isEqualTo(1)
    }

    @Test
    fun `나간 방에 남은 고정은 개수에 세지 않는다`() {
        // given
        saveRoom(partnerId = 2L, pinned = true)
        val left = saveRoom(partnerId = 3L, pinned = true)
        chatRoomRepository.softDeleteAllByIdIn(listOf(left))

        // when
        val count = chatRoomMemberRepository.countPinnedRooms(ME_ID)

        // then
        assertThat(count).isEqualTo(1L)
        assertThat(chatRoomMemberRepository.findByRoomIdAndMemberId(left, ME_ID)!!.pinned).isTrue()
    }

    private fun saveRoom(partnerId: Long, pinned: Boolean = false): Long {
        val room = chatRoomRepository.saveAndFlush(ChatRoom.of(ME_ID, partnerId))
        val message = chatMessageRepository.saveAndFlush(
            ChatMessage(roomId = room.id, senderId = partnerId, type = ChatMessageType.TEXT, content = "안녕"),
        )
        room.lastMessageId = message.id
        chatRoomRepository.saveAndFlush(room)
        chatRoomMemberRepository.saveAllAndFlush(
            listOf(
                ChatRoomMember(roomId = room.id, memberId = ME_ID, lastMessageId = message.id, pinned = pinned),
                ChatRoomMember(roomId = room.id, memberId = partnerId, lastMessageId = message.id),
            ),
        )

        return room.id
    }

    private fun deletedCount(roomIds: List<Long>) = entityManager
        .createNativeQuery("select count(*) from chat_room where id in (:ids) and deleted_at is not null")
        .setParameter("ids", roomIds)
        .singleResult
        .let { (it as Number).toLong() }

    companion object {

        private const val ME_ID = 1L
        private const val PAGE_SIZE = 20
    }
}
