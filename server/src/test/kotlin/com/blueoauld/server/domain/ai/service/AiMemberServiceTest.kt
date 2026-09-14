package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.request.AiPersonaRequest
import com.blueoauld.server.domain.ai.dto.request.CreateAiMemberRequest
import com.blueoauld.server.domain.ai.dto.request.UpdateAiMemberRequest
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.repository.AiReplyJobRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.domain.member.service.MemberPhotoService
import com.blueoauld.server.domain.member.service.MemberWithdrawService
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.security.crypto.password.PasswordEncoder
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class AiMemberServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val nicknameHistoryRepository = mockk<NicknameHistoryRepository>(relaxed = true)

    private val aiPersonaRepository = mockk<AiPersonaRepository>(relaxed = true)

    private val aiReplyJobRepository = mockk<AiReplyJobRepository>(relaxed = true)

    private val memberPhotoService = mockk<MemberPhotoService>(relaxed = true)

    private val memberWithdrawService = mockk<MemberWithdrawService>(relaxed = true)

    private val passwordEncoder = mockk<PasswordEncoder>()

    private val aiMemberService = AiMemberService(
        memberRepository,
        nicknameHistoryRepository,
        aiPersonaRepository,
        aiReplyJobRepository,
        memberPhotoService,
        memberWithdrawService,
        passwordEncoder,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { passwordEncoder.encode(any()) } returns "encoded"
        every { memberRepository.existsByNicknameIgnoreCase(any()) } returns false
        every { memberRepository.save(any<Member>()) } answers { firstArg() }
        every { nicknameHistoryRepository.save(any()) } answers { firstArg() }
        every { aiPersonaRepository.save(any()) } answers { firstArg() }
    }

    @Test
    fun `AI 계정을 만들면 AI 역할 회원과 페르소나가 함께 저장된다`() {
        // given
        val savedMember = slot<Member>()
        val savedPersona = slot<AiPersona>()
        every { memberRepository.save(capture(savedMember)) } answers { firstArg() }
        every { aiPersonaRepository.save(capture(savedPersona)) } answers { firstArg() }

        // when
        aiMemberService.create(createRequest())

        // then
        assertThat(savedMember.captured.role).isEqualTo(MemberRole.AI)
        assertThat(savedMember.captured.phoneNumber).startsWith(Member.AI_PHONE_NUMBER_PREFIX)
        assertThat(savedMember.captured.phoneNumber).hasSize(Member.PHONE_NUMBER_LENGTH)
        assertThat(savedMember.captured.phoneNumber).doesNotMatch(Member.PHONE_NUMBER_PATTERN)
        assertThat(savedMember.captured.nickname).isEqualTo("루나")
        assertThat(savedMember.captured.locatedAt).isEqualTo(NOW)
        assertThat(savedPersona.captured.systemPrompt).isEqualTo("밝은 성격")
        assertThat(savedPersona.captured.nextLocationRefreshAt).isEqualTo(NOW)
        verify { nicknameHistoryRepository.save(any()) }
    }

    @Test
    fun `닉네임이 겹치면 만들 수 없다`() {
        // given
        every { memberRepository.existsByNicknameIgnoreCase("루나") } returns true

        // when, then
        assertThatThrownBy { aiMemberService.create(createRequest()) }
            .isInstanceOf(BusinessException::class.java)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.DUPLICATE_NICKNAME)
    }

    @Test
    fun `응답 지연 최소값이 최대값보다 크면 만들 수 없다`() {
        // given
        val request = createRequest().copy(
            persona = AiPersonaRequest(systemPrompt = "밝은 성격", replyDelayMinSeconds = 100, replyDelayMaxSeconds = 10),
        )

        // when, then
        assertThatThrownBy { aiMemberService.create(request) }
            .isInstanceOf(BusinessException::class.java)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.INVALID_REPLY_DELAY)
    }

    @Test
    fun `가입 가능 나이를 벗어나면 만들 수 없다`() {
        // given
        val request = createRequest().copy(birthYear = 2020)

        // when, then
        assertThatThrownBy { aiMemberService.create(request) }
            .isInstanceOf(BusinessException::class.java)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.INVALID_BIRTH_YEAR)
    }

    @Test
    fun `수정하면 회원과 페르소나가 바뀌고 닉네임이 바뀌면 이력이 남는다`() {
        // given
        val member = member()
        val persona = persona()
        every { aiPersonaRepository.findById(MEMBER_ID) } returns Optional.of(persona)
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)

        // when
        aiMemberService.update(MEMBER_ID, updateRequest())

        // then
        assertThat(member.nickname).isEqualTo("하늘")
        assertThat(member.latitude).isEqualTo(35.1)
        assertThat(persona.enabled).isFalse()
        assertThat(persona.systemPrompt).isEqualTo("차분한 성격")
        assertThat(persona.dailyReplyLimit).isEqualTo(50)
        verify { nicknameHistoryRepository.save(match { it.nickname == "하늘" }) }
    }

    @Test
    fun `수정하면 미뤄진 응답 작업을 새 응답 지연 안으로 당긴다`() {
        // given
        every { aiPersonaRepository.findById(MEMBER_ID) } returns Optional.of(persona())
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())

        // when
        aiMemberService.update(MEMBER_ID, updateRequest())

        // then
        verify {
            aiReplyJobRepository.pullForward(
                MEMBER_ID,
                match { it >= NOW.plusSeconds(5) && it <= NOW.plusSeconds(60) },
                NOW,
            )
        }
    }

    @Test
    fun `닉네임이 그대로면 이력을 남기지 않는다`() {
        // given
        val member = member()
        every { aiPersonaRepository.findById(MEMBER_ID) } returns Optional.of(persona())
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member)

        // when
        aiMemberService.update(MEMBER_ID, updateRequest().copy(nickname = "루나"))

        // then
        verify(exactly = 0) { nicknameHistoryRepository.save(any()) }
    }

    @Test
    fun `페르소나가 없는 회원은 수정할 수 없다`() {
        // given
        every { aiPersonaRepository.findById(MEMBER_ID) } returns Optional.empty()

        // when, then
        assertThatThrownBy { aiMemberService.update(MEMBER_ID, updateRequest()) }
            .isInstanceOf(BusinessException::class.java)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.AI_MEMBER_NOT_FOUND)
    }

    @Test
    fun `삭제하면 탈퇴 절차를 거치고 페르소나를 지운다`() {
        // given
        val persona = persona()
        every { aiPersonaRepository.findById(MEMBER_ID) } returns Optional.of(persona)

        // when
        aiMemberService.withdraw(MEMBER_ID)

        // then
        verify { memberWithdrawService.withdraw(MEMBER_ID) }
        verify { aiPersonaRepository.delete(persona) }
    }

    private fun createRequest() = CreateAiMemberRequest(
        nickname = " 루나 ",
        gender = Gender.FEMALE,
        birthYear = 1998,
        comment = "안녕",
        bio = null,
        latitude = 37.5,
        longitude = 127.0,
        persona = AiPersonaRequest(systemPrompt = "밝은 성격"),
    )

    private fun updateRequest() = UpdateAiMemberRequest(
        nickname = "하늘",
        birthYear = 1995,
        comment = null,
        bio = "소개",
        latitude = 35.1,
        longitude = 129.0,
        persona = AiPersonaRequest(
            enabled = false,
            systemPrompt = "차분한 성격",
            replyDelayMinSeconds = 5,
            replyDelayMaxSeconds = 60,
            activeStartHour = 9,
            activeEndHour = 22,
            dailyReplyLimit = 50,
        ),
    )

    private fun member() = Member(
        phoneNumber = "AI-0000000000000",
        password = "encoded",
        gender = Gender.FEMALE,
        nickname = "루나",
        birthYear = 1998,
        role = MemberRole.AI,
        latitude = 37.5,
        longitude = 127.0,
    )

    private fun persona() = AiPersona(
        memberId = MEMBER_ID,
        systemPrompt = "밝은 성격",
        nextLocationRefreshAt = NOW,
    )

    companion object {

        private const val MEMBER_ID = 0L
        private val NOW: Instant = Instant.parse("2026-09-14T00:00:00Z")
    }
}
