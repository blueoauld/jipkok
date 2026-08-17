package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.chat.entity.ChatRoom
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class ChatRoomRepositoryTest {

    @Autowired
    private lateinit var chatRoomRepository: ChatRoomRepository

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

    private fun deletedCount(roomIds: List<Long>) = entityManager
        .createNativeQuery("select count(*) from chat_room where id in (:ids) and deleted_at is not null")
        .setParameter("ids", roomIds)
        .singleResult
        .let { (it as Number).toLong() }
}
