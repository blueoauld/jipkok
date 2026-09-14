package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReplyDecision
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.entity.AiReplyJob
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.repository.AiReplyLogRepository
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.ChatRoom
import com.blueoauld.server.domain.chat.entity.ChatRoomMember
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class AiReplyContextServiceTest {

    private val aiPersonaRepository = mockk<AiPersonaRepository>()

    private val aiReplyLogRepository = mockk<AiReplyLogRepository>()

    private val chatRoomRepository = mockk<ChatRoomRepository>()

    private val chatRoomMemberRepository = mockk<ChatRoomMemberRepository>()

    private val chatMessageRepository = mockk<ChatMessageRepository>()

    private val memberRepository = mockk<MemberRepository>()

    private val memberSuspensionService = mockk<MemberSuspensionService>()

    private val ai = member(MemberRole.AI)

    private val partner = member(MemberRole.MEMBER)

    @BeforeEach
    fun setUp() {
        every { aiPersonaRepository.findById(AI_ID) } returns Optional.of(persona())
        every { chatRoomRepository.findById(ROOM_ID) } returns Optional.of(ChatRoom.of(USER_ID, AI_ID))
        every { memberRepository.findById(AI_ID) } returns Optional.of(ai)
        every { memberRepository.findById(USER_ID) } returns Optional.of(partner)
        every { memberSuspensionService.isSuspended(AI_ID, SuspensionType.SERVICE) } returns false
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, AI_ID) } returns
            roomMember(lastReadMessageId = 0L)
        every { chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(ROOM_ID, Long.MAX_VALUE, any()) } returns
            listOf(message(USER_ID, "뭐해?"), message(AI_ID, "안녕"))
        every { aiReplyLogRepository.countByRoomIdAndCreatedAtGreaterThanEqual(ROOM_ID, any()) } returns 0
        every { aiReplyLogRepository.countByAiMemberIdAndCreatedAtGreaterThanEqual(AI_ID, any()) } returns 0
        every { aiReplyLogRepository.countByCreatedAtGreaterThanEqual(any()) } returns 0
    }

    @Test
    fun `활동 시간이고 한도 안이면 시간순 메시지를 담은 문맥을 준다`() {
        // when
        val decision = service(DAYTIME).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiReplyDecision.Reply::class.java)
        val context = (decision as AiReplyDecision.Reply).context
        assertThat(context.messages.map { it.content }).containsExactly("안녕", "뭐해?")
        assertThat(context.partner).isSameAs(partner)
        assertThat(context.systemPrompt).isEqualTo("프롬프트")
    }

    @Test
    fun `비활성 페르소나면 버린다`() {
        // given
        every { aiPersonaRepository.findById(AI_ID) } returns Optional.of(persona(enabled = false))

        // when
        val decision = service(DAYTIME).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiReplyDecision.Drop::class.java)
    }

    @Test
    fun `AI가 서비스 정지 중이면 버린다`() {
        // given
        every { memberSuspensionService.isSuspended(AI_ID, SuspensionType.SERVICE) } returns true

        // when
        val decision = service(DAYTIME).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiReplyDecision.Drop::class.java)
    }

    @Test
    fun `작업의 메시지가 이미 읽은 것이면 버린다`() {
        // given
        every { chatRoomMemberRepository.findByRoomIdAndMemberId(ROOM_ID, AI_ID) } returns
            roomMember(lastReadMessageId = LAST_MESSAGE_ID)

        // when
        val decision = service(DAYTIME).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiReplyDecision.Drop::class.java)
    }

    @Test
    fun `활동 시간이 아니면 다음 활동 시작 뒤 응답 지연 안으로 미룬다`() {
        // when
        val decision = service(NIGHT).decide(job())

        // then
        val start = Instant.parse("2026-09-15T08:00:00+09:00")
        assertThat(decision).isInstanceOf(AiReplyDecision.Postpone::class.java)
        assertThat((decision as AiReplyDecision.Postpone).dueAt).isBetween(start.plusSeconds(10), start.plusSeconds(20))
    }

    @Test
    fun `방의 하루 응답 한도에 닿으면 버린다`() {
        // given
        every { aiReplyLogRepository.countByRoomIdAndCreatedAtGreaterThanEqual(ROOM_ID, DAY_START) } returns
            AiReplyContextService.ROOM_DAILY_LIMIT

        // when
        val decision = service(DAYTIME).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiReplyDecision.Drop::class.java)
    }

    @Test
    fun `AI의 하루 응답 한도에 닿으면 버린다`() {
        // given
        every { aiReplyLogRepository.countByAiMemberIdAndCreatedAtGreaterThanEqual(AI_ID, DAY_START) } returns 3

        // when
        val decision = service(DAYTIME).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiReplyDecision.Drop::class.java)
    }

    @Test
    fun `전체 하루 응답 한도에 닿으면 버린다`() {
        // given
        every { aiReplyLogRepository.countByCreatedAtGreaterThanEqual(DAY_START) } returns
            AiReplyContextService.GLOBAL_DAILY_LIMIT

        // when
        val decision = service(DAYTIME).decide(job())

        // then
        assertThat(decision).isInstanceOf(AiReplyDecision.Drop::class.java)
    }

    private fun service(now: Instant) = AiReplyContextService(
        aiPersonaRepository,
        aiReplyLogRepository,
        chatRoomRepository,
        chatRoomMemberRepository,
        chatMessageRepository,
        memberRepository,
        memberSuspensionService,
        Clock.fixed(now, ZoneOffset.UTC),
    )

    private fun persona(enabled: Boolean = true) = AiPersona(
        memberId = AI_ID,
        enabled = enabled,
        systemPrompt = "프롬프트",
        replyDelayMinSeconds = 10,
        replyDelayMaxSeconds = 20,
        dailyReplyLimit = 3,
        nextLocationRefreshAt = DAYTIME,
    )

    private fun member(role: MemberRole) = mockk<Member> {
        every { id } returns if (role == MemberRole.AI) AI_ID else USER_ID
    }

    private fun message(senderId: Long, content: String) = ChatMessage(
        roomId = ROOM_ID,
        senderId = senderId,
        type = ChatMessageType.TEXT,
        content = content,
    )

    private fun roomMember(lastReadMessageId: Long) = ChatRoomMember(ROOM_ID, AI_ID).apply {
        this.lastReadMessageId = lastReadMessageId
    }

    private fun job() =
        AiReplyJob(roomId = ROOM_ID, aiMemberId = AI_ID, lastMessageId = LAST_MESSAGE_ID, dueAt = DAYTIME)

    companion object {

        private const val ROOM_ID = 0L
        private const val AI_ID = 5L
        private const val USER_ID = 9L
        private const val LAST_MESSAGE_ID = 40L
        private val DAYTIME: Instant = Instant.parse("2026-09-15T12:00:00+09:00")
        private val NIGHT: Instant = Instant.parse("2026-09-15T03:00:00+09:00")
        private val DAY_START: Instant = Instant.parse("2026-09-15T00:00:00+09:00")
    }
}
