package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.request.AiTestChatMessage
import com.blueoauld.server.domain.ai.dto.request.AiTestChatRequest
import com.blueoauld.server.domain.ai.dto.request.AiTestChatRole
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class AiTestChatServiceTest {

    private val aiPersonaRepository = mockk<AiPersonaRepository>()

    private val memberRepository = mockk<MemberRepository>()

    private val aiReplyGenerator = mockk<AiReplyGenerator>()

    private val service = AiTestChatService(
        aiPersonaRepository,
        memberRepository,
        aiReplyGenerator,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    private val ai = mockk<Member> {
        every { id } returns AI_ID
        every { gender } returns Gender.FEMALE
    }

    @BeforeEach
    fun setUp() {
        every { aiPersonaRepository.findById(AI_ID) } returns Optional.of(persona())
        every { memberRepository.findById(AI_ID) } returns Optional.of(ai)
    }

    @Test
    fun `저장된 페르소나와 가짜 상대로 문맥을 만들어 답을 받는다`() {
        // given
        val context = slot<AiReplyContext>()
        every { aiReplyGenerator.generate(capture(context)) } returns REPLY

        // when
        val reply = service.chat(AI_ID, request(systemPrompt = null, locale = MemberLocale.JA))

        // then
        assertThat(reply).isEqualTo(REPLY)
        assertThat(context.captured.systemPrompt).isEqualTo("저장된 프롬프트")
        assertThat(context.captured.partner.gender).isEqualTo(Gender.MALE)
        assertThat(context.captured.partner.locale).isEqualTo(MemberLocale.JA)
        assertThat(context.captured.partner.birthYear).isEqualTo(2026 - AiTestChatService.PARTNER_AGE)
        assertThat(context.captured.messages.map { it.senderId }).containsExactly(0L, AI_ID, 0L)
        assertThat(context.captured.messages.map { it.content }).containsExactly("안녕", "반가워", "뭐해?")
    }

    @Test
    fun `프롬프트를 보내면 저장된 페르소나 대신 그 내용을 쓴다`() {
        // given
        val context = slot<AiReplyContext>()
        every { aiReplyGenerator.generate(capture(context)) } returns REPLY

        // when
        service.chat(AI_ID, request(systemPrompt = " 초안 프롬프트 ", locale = MemberLocale.KO))

        // then
        assertThat(context.captured.systemPrompt).isEqualTo("초안 프롬프트")
    }

    @Test
    fun `답은 실제로 나갈 말풍선을 줄바꿈으로 이어 돌려준다`() {
        // given
        every { aiReplyGenerator.generate(any()) } returns REPLY.copy(content = "산책 중이야. 날씨 좋다.")

        // when
        val reply = service.chat(AI_ID, request(systemPrompt = null, locale = MemberLocale.KO))

        // then
        assertThat(reply.content).isEqualTo("산책 중이야\n날씨 좋다")
    }

    @Test
    fun `답을 만들 수 없으면 예외를 던진다`() {
        // given
        every { aiReplyGenerator.generate(any()) } returns null

        // when, then
        assertThatThrownBy { service.chat(AI_ID, request(systemPrompt = null, locale = MemberLocale.KO)) }
            .isInstanceOf(BusinessException::class.java)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.AI_REPLY_UNAVAILABLE)
    }

    private fun request(systemPrompt: String?, locale: MemberLocale) = AiTestChatRequest(
        systemPrompt = systemPrompt,
        locale = locale,
        messages = listOf(
            AiTestChatMessage(AiTestChatRole.USER, "안녕"),
            AiTestChatMessage(AiTestChatRole.AI, "반가워"),
            AiTestChatMessage(AiTestChatRole.USER, " 뭐해? "),
        ),
    )

    private fun persona() = AiPersona(memberId = AI_ID, systemPrompt = "저장된 프롬프트", nextLocationRefreshAt = NOW)

    companion object {

        private const val AI_ID = 5L
        private val NOW: Instant = Instant.parse("2026-09-15T03:00:00Z")
        private val REPLY = AiReply(
            content = "나 지금 산책 중!",
            promptTokens = 90,
            completionTokens = 7,
            cachedTokens = 0,
            model = "m",
        )
    }
}
