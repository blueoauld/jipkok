package com.blueoauld.server.domain.chat.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.TransactionDefinition
import org.springframework.transaction.support.TransactionTemplate

@Import(TestcontainersConfiguration::class)
@SpringBootTest
class ChatRoomMemberUpdateCommitTest {

    @Autowired
    private lateinit var chatRoomMemberRepository: ChatRoomMemberRepository

    @Autowired
    private lateinit var transactionManager: PlatformTransactionManager

    private var roomMemberId: Long = 0

    @AfterEach
    fun tearDown() {
        chatRoomMemberRepository.deleteById(roomMemberId)
    }

    @Test
    fun `방 설정을 고치는 사이 새 메시지로 오른 안 읽은 수를 덮어쓰지 않는다`() {
        // given
        roomMemberId = chatRoomMemberRepository.saveAndFlush(ChatRoomMember(ROOM_ID, MEMBER_ID)).id

        // when
        TransactionTemplate(transactionManager).executeWithoutResult {
            val roomMember = chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, MEMBER_ID)!!

            newTransaction().executeWithoutResult {
                chatRoomMemberRepository.applyLastMessage(ROOM_ID, LAST_MESSAGE_ID, MEMBER_ID)
            }

            roomMember.pinned = true
        }

        // then
        val roomMember = chatRoomMemberRepository.findById(roomMemberId).get()
        assertThat(roomMember.unreadCount).isEqualTo(1)
        assertThat(roomMember.lastMessageId).isEqualTo(LAST_MESSAGE_ID)
        assertThat(roomMember.pinned).isTrue()
    }

    private fun newTransaction() = TransactionTemplate(transactionManager).apply {
        propagationBehavior = TransactionDefinition.PROPAGATION_REQUIRES_NEW
    }

    companion object {

        private const val ROOM_ID = 999_999L
        private const val MEMBER_ID = 999_998L
        private const val LAST_MESSAGE_ID = 10L
    }
}
