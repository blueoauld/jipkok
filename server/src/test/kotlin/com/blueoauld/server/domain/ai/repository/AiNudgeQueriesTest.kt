package com.blueoauld.server.domain.ai.repository

import com.blueoauld.server.TestcontainersConfiguration
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.entity.AiReplyJob
import com.blueoauld.server.domain.ai.entity.AiReplyLog
import com.blueoauld.server.domain.ai.entity.type.AiReplyKind
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.domain.member.repository.MemberRepository
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit

@Import(TestcontainersConfiguration::class)
@SpringBootTest
@Transactional
class AiNudgeQueriesTest {

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var aiPersonaRepository: AiPersonaRepository

    @Autowired
    private lateinit var aiReplyJobRepository: AiReplyJobRepository

    @Autowired
    private lateinit var aiReplyLogRepository: AiReplyLogRepository

    @Autowired
    private lateinit var chatRoomRepository: ChatRoomRepository

    @Autowired
    private lateinit var chatMessageRepository: ChatMessageRepository

    @PersistenceContext
    private lateinit var entityManager: EntityManager

    @Test
    fun `AI가 마지막으로 말한 뒤 조용한 방만 후보가 된다`() {
        // given
        val ai = saveAi()
        val quiet = saveRoom(ai, "+821077770001", lastSenderIsAi = true, daysAgo = 3)
        saveRoom(ai, "+821077770002", lastSenderIsAi = false, daysAgo = 3)
        saveRoom(ai, "+821077770003", lastSenderIsAi = true, daysAgo = 1)
        saveRoom(ai, "+821077770004", lastSenderIsAi = true, daysAgo = 20)

        // when
        val rows = aiReplyJobRepository.findNudgeCandidates(oldest(), threshold(), 10)

        // then
        assertThat(rows.map { it.roomId }).containsExactly(quiet)
        assertThat(rows.single().aiMemberId).isEqualTo(ai.id)
    }

    @Test
    fun `이번 침묵에 이미 말을 걸었거나 작업이 있거나 페르소나가 비활성이면 뺀다`() {
        // given
        val ai = saveAi()
        val nudged = saveRoom(ai, "+821077770011", lastSenderIsAi = true, daysAgo = 3)
        aiReplyLogRepository.saveAndFlush(log(ai.id, nudged, messageId = lastMessageId(nudged)))
        val queued = saveRoom(ai, "+821077770012", lastSenderIsAi = true, daysAgo = 3)
        aiReplyJobRepository.saveAndFlush(AiReplyJob(queued, ai.id, lastMessageId(queued), Instant.now()))
        val disabledAi = saveAi(enabled = false)
        saveRoom(disabledAi, "+821077770013", lastSenderIsAi = true, daysAgo = 3)

        // when
        val rows = aiReplyJobRepository.findNudgeCandidates(oldest(), threshold(), 10)

        // then
        assertThat(rows).isEmpty()
    }

    @Test
    fun `말을 건 뒤 상대가 답하고 다시 조용해지면 다시 후보가 된다`() {
        // given
        val ai = saveAi()
        val room = saveRoom(ai, "+821077770021", lastSenderIsAi = true, daysAgo = 10)
        val partnerId = partnerIdOf(room, ai.id)
        val firstNudge = saveMessage(room, ai.id, daysAgo = 8)
        aiReplyLogRepository.saveAndFlush(log(ai.id, room, messageId = firstNudge))
        saveMessage(room, partnerId, daysAgo = 7)
        val latest = saveMessage(room, ai.id, daysAgo = 5)
        setLastMessage(room, latest)

        // when
        val rows = aiReplyJobRepository.findNudgeCandidates(oldest(), threshold(), 10)

        // then
        assertThat(rows.map { it.roomId }).containsExactly(room)
        assertThat(rows.single().lastMessageId).isEqualTo(latest)
    }

    private fun saveAi(enabled: Boolean = true): Member {
        val member = memberRepository.saveAndFlush(
            Member(
                phoneNumber = Member.generateAiPhoneNumber(),
                password = "encoded-password",
                gender = Gender.FEMALE,
                nickname = "ai${System.nanoTime() % 100_000}",
                birthYear = 1998,
                role = MemberRole.AI,
            ),
        )
        aiPersonaRepository.saveAndFlush(
            AiPersona(
                memberId = member.id,
                enabled = enabled,
                systemPrompt = "프롬프트",
                nextLocationRefreshAt = Instant.now(),
            ),
        )

        return member
    }

    private fun saveRoom(ai: Member, partnerPhone: String, lastSenderIsAi: Boolean, daysAgo: Long): Long {
        val partner = memberRepository.saveAndFlush(
            Member(
                phoneNumber = partnerPhone,
                password = "encoded-password",
                gender = Gender.MALE,
                nickname = partnerPhone.takeLast(10),
                birthYear = 1995,
            ),
        )
        val room = chatRoomRepository.saveAndFlush(ChatRoom.of(partner.id, ai.id))
        saveMessage(room.id, partner.id, daysAgo = daysAgo + 1)
        val last = saveMessage(room.id, if (lastSenderIsAi) ai.id else partner.id, daysAgo)
        setLastMessage(room.id, last)

        return room.id
    }

    private fun saveMessage(roomId: Long, senderId: Long, daysAgo: Long): Long {
        val message = chatMessageRepository.saveAndFlush(
            ChatMessage(roomId = roomId, senderId = senderId, type = ChatMessageType.TEXT, content = "안녕"),
        )
        entityManager.createNativeQuery("update chat_message set created_at = :at where id = :id")
            .setParameter("at", Instant.now().minus(daysAgo, ChronoUnit.DAYS))
            .setParameter("id", message.id)
            .executeUpdate()

        return message.id
    }

    private fun setLastMessage(roomId: Long, messageId: Long) {
        entityManager.createNativeQuery("update chat_room set last_message_id = :messageId where id = :roomId")
            .setParameter("messageId", messageId)
            .setParameter("roomId", roomId)
            .executeUpdate()
        entityManager.clear()
    }

    private fun lastMessageId(roomId: Long): Long = chatRoomRepository.findById(roomId).orElseThrow().lastMessageId

    private fun partnerIdOf(roomId: Long, aiId: Long): Long =
        chatRoomRepository.findById(roomId).orElseThrow().partnerIdOf(aiId)

    private fun log(aiId: Long, roomId: Long, messageId: Long) = AiReplyLog(
        aiMemberId = aiId,
        roomId = roomId,
        messageId = messageId,
        promptTokens = 1,
        completionTokens = 1,
        model = null,
        kind = AiReplyKind.NUDGE,
    )

    private fun oldest(): Instant = Instant.now().minus(14, ChronoUnit.DAYS)

    private fun threshold(): Instant = Instant.now().minus(2, ChronoUnit.DAYS)
}
