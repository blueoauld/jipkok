package com.blueoauld.server.domain.admin.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.ai.entity.AiGreetingJob
import com.blueoauld.server.domain.ai.entity.type.AiGreetingState
import com.blueoauld.server.domain.ai.repository.AiGreetingJobRepository
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.domain.member.repository.MemberRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class AdminAiGreetingQueriesTest {

    @Autowired
    private lateinit var aiGreetingJobAdminRepository: AiGreetingJobAdminRepository

    @Autowired
    private lateinit var aiGreetingJobRepository: AiGreetingJobRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var chatRoomRepository: ChatRoomRepository

    @Autowired
    private lateinit var chatMessageRepository: ChatMessageRepository

    @Test
    fun `보낸 인사 수와 그중 상대가 답한 방 수를 AI별로 센다`() {
        // given
        val ai = saveMember(Gender.MALE, Member.generateAiPhoneNumber(), role = MemberRole.AI)
        val replied = saveMember(Gender.FEMALE, "+821099990001")
        val silent = saveMember(Gender.FEMALE, "+821099990002")
        val old = saveMember(Gender.FEMALE, "+821099990003")
        val now = Instant.now()
        val repliedRoom = saveRoom(ai, replied, partnerReplied = true)
        val silentRoom = saveRoom(ai, silent, partnerReplied = false)
        val oldRoom = saveRoom(ai, old, partnerReplied = true)
        aiGreetingJobRepository.saveAndFlush(sentJob(replied, ai, repliedRoom, sentAt = now))
        aiGreetingJobRepository.saveAndFlush(sentJob(silent, ai, silentRoom, sentAt = now))
        aiGreetingJobRepository.saveAndFlush(sentJob(old, ai, oldRoom, sentAt = now.minus(Duration.ofDays(2))))
        val dayStart = now.minus(Duration.ofHours(1))

        // when
        val today = aiGreetingJobAdminRepository.sumByAiMemberIdSince(listOf(ai), dayStart).single()
        val total = aiGreetingJobAdminRepository.sumAllSince(Instant.EPOCH)

        // then
        assertThat(today.aiMemberId).isEqualTo(ai)
        assertThat(today.greetingCount).isEqualTo(2)
        assertThat(today.greetingReplyCount).isEqualTo(1)
        assertThat(total.greetingCount).isEqualTo(3)
        assertThat(total.greetingReplyCount).isEqualTo(2)
    }

    @Test
    fun `보낸 인사가 없으면 0을 준다`() {
        // when
        val total = aiGreetingJobAdminRepository.sumAllSince(Instant.now())

        // then
        assertThat(total.greetingCount).isZero()
        assertThat(total.greetingReplyCount).isZero()
    }

    private fun saveRoom(aiId: Long, partnerId: Long, partnerReplied: Boolean): Long {
        val room = chatRoomRepository.saveAndFlush(ChatRoom.of(aiId, partnerId))
        chatMessageRepository.saveAndFlush(
            ChatMessage(roomId = room.id, senderId = aiId, type = ChatMessageType.TEXT, content = "안녕하세요"),
        )

        if (partnerReplied) {
            chatMessageRepository.saveAndFlush(
                ChatMessage(roomId = room.id, senderId = partnerId, type = ChatMessageType.TEXT, content = "네 안녕하세요"),
            )
        }

        return room.id
    }

    private fun sentJob(memberId: Long, aiMemberId: Long, roomId: Long, sentAt: Instant) = AiGreetingJob(
        memberId = memberId,
        dueAt = sentAt,
        state = AiGreetingState.SENT,
        aiMemberId = aiMemberId,
        roomId = roomId,
        sentAt = sentAt,
    )

    private fun saveMember(gender: Gender, phoneNumber: String, role: MemberRole = MemberRole.MEMBER): Long =
        memberRepository.saveAndFlush(
            Member(
                phoneNumber = phoneNumber,
                password = "encoded-password",
                gender = gender,
                nickname = "m${System.nanoTime() % 100_000}",
                birthYear = 1998,
                role = role,
            ),
        ).id
}
