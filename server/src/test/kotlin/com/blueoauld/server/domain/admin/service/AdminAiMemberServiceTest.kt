package com.blueoauld.server.domain.admin.service

import com.blueoauld.server.domain.admin.dto.projection.AdminAiMemberRow
import com.blueoauld.server.domain.admin.dto.projection.AiGreetingStatRow
import com.blueoauld.server.domain.admin.dto.projection.AiGreetingTotalRow
import com.blueoauld.server.domain.admin.dto.projection.AiReplyStatRow
import com.blueoauld.server.domain.admin.dto.projection.AiReplyTotalRow
import com.blueoauld.server.domain.admin.dto.response.AdminAiReplyStatResponse
import com.blueoauld.server.domain.admin.entity.type.AdminActionType
import com.blueoauld.server.domain.admin.repository.AiGreetingJobAdminRepository
import com.blueoauld.server.domain.admin.repository.AiMemberAdminRepository
import com.blueoauld.server.domain.admin.repository.AiReplyLogAdminRepository
import com.blueoauld.server.domain.ai.dto.request.AiPersonaRequest
import com.blueoauld.server.domain.ai.dto.request.CreateAiMemberRequest
import com.blueoauld.server.domain.ai.dto.request.UpdateAiMemberPhotosRequest
import com.blueoauld.server.domain.ai.entity.AiPersona
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.service.AiMemberService
import com.blueoauld.server.domain.ai.service.AiTestChatService
import com.blueoauld.server.domain.member.dto.response.ProfilePhotoResponse
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.service.MemberPhotoService
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class AdminAiMemberServiceTest {

    private val aiMemberAdminRepository = mockk<AiMemberAdminRepository>()

    private val aiReplyLogAdminRepository = mockk<AiReplyLogAdminRepository>()

    private val aiGreetingJobAdminRepository = mockk<AiGreetingJobAdminRepository>()

    private val aiPersonaRepository = mockk<AiPersonaRepository>()

    private val memberRepository = mockk<MemberRepository>()

    private val memberPhotoService = mockk<MemberPhotoService>()

    private val aiMemberService = mockk<AiMemberService>(relaxed = true)

    private val aiTestChatService = mockk<AiTestChatService>()

    private val adminActionRecorder = mockk<AdminActionRecorder>(relaxed = true)

    private val adminAiMemberService = AdminAiMemberService(
        aiMemberAdminRepository,
        aiReplyLogAdminRepository,
        aiGreetingJobAdminRepository,
        aiPersonaRepository,
        memberRepository,
        memberPhotoService,
        aiMemberService,
        aiTestChatService,
        adminActionRecorder,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { aiReplyLogAdminRepository.sumByAiMemberIdSince(listOf(MEMBER_ID), DAY_START) } returns
            listOf(statRow(replyCount = 4, tokenCount = 900))
        every { aiReplyLogAdminRepository.sumByAiMemberIdSince(listOf(MEMBER_ID), Instant.EPOCH) } returns
            listOf(statRow(replyCount = 40, tokenCount = 9000))
        every { aiReplyLogAdminRepository.sumAllSince(DAY_START) } returns totalRow(replyCount = 12, tokenCount = 3000)
        every { aiGreetingJobAdminRepository.sumByAiMemberIdSince(listOf(MEMBER_ID), DAY_START) } returns
            listOf(greetingRow(greetingCount = 3, greetingReplyCount = 1))
        every { aiGreetingJobAdminRepository.sumByAiMemberIdSince(listOf(MEMBER_ID), Instant.EPOCH) } returns
            emptyList()
        every { aiGreetingJobAdminRepository.sumAllSince(DAY_START) } returns
            greetingTotalRow(greetingCount = 5, greetingReplyCount = 2)
    }

    @Test
    fun `검색어는 와일드카드를 이스케이프해 닉네임 조건으로 넘기고 오늘과 누적 통계를 붙인다`() {
        // given
        every { aiMemberAdminRepository.findAllForAdmin(true, """%루\%%""", 20, 0) } returns listOf(row())
        every { aiMemberAdminRepository.countForAdmin(true, """%루\%%""") } returns 1

        // when
        val response = adminAiMemberService.findMembers(true, " 루% ", 1, 20)

        // then
        assertThat(response.totalCount).isEqualTo(1)
        assertThat(response.items.single().age).isEqualTo(28)
        assertThat(response.items.single().greetingEnabled).isTrue()
        assertThat(response.items.single().today.replyCount).isEqualTo(4)
        assertThat(response.items.single().today.greetingCount).isEqualTo(3)
        assertThat(response.items.single().today.greetingReplyCount).isEqualTo(1)
        assertThat(response.items.single().total.tokenCount).isEqualTo(9000)
        assertThat(response.items.single().total.greetingCount).isZero()
        assertThat(response.todayTotal.replyCount).isEqualTo(12)
        assertThat(response.todayTotal.greetingCount).isEqualTo(5)
        assertThat(response.globalDailyLimit).isEqualTo(2000)
        assertThat(response.globalDailyGreetingLimit).isEqualTo(200)
    }

    @Test
    fun `통계가 없는 계정은 0으로 채운다`() {
        // given
        every { aiMemberAdminRepository.findAllForAdmin(null, null, 20, 0) } returns listOf(row())
        every { aiMemberAdminRepository.countForAdmin(null, null) } returns 1
        every { aiReplyLogAdminRepository.sumByAiMemberIdSince(listOf(MEMBER_ID), any()) } returns emptyList()
        every { aiGreetingJobAdminRepository.sumByAiMemberIdSince(listOf(MEMBER_ID), any()) } returns emptyList()

        // when
        val response = adminAiMemberService.findMembers(null, null, 1, 20)

        // then
        assertThat(response.items.single().today).isEqualTo(AdminAiReplyStatResponse.EMPTY)
    }

    @Test
    fun `상세는 회원, 페르소나, 사진을 합쳐 준다`() {
        // given
        stubDetail()

        // when
        val response = adminAiMemberService.findDetail(MEMBER_ID)

        // then
        assertThat(response.nickname).isEqualTo("루나")
        assertThat(response.persona.systemPrompt).isEqualTo("밝은 성격")
        assertThat(response.persona.greetingEnabled).isFalse()
        assertThat(response.persona.dailyGreetingLimit).isEqualTo(20)
        assertThat(response.publicPhotos).hasSize(1)
        assertThat(response.secretPhotos).isEmpty()
        assertThat(response.today.tokenCount).isEqualTo(900)
        assertThat(response.today.greetingCount).isEqualTo(3)
        assertThat(response.total.replyCount).isEqualTo(40)
    }

    @Test
    fun `만들면 생성 조치를 남기고 상세를 준다`() {
        // given
        every { aiMemberService.create(any()) } returns MEMBER_ID
        stubDetail()

        // when
        val response = adminAiMemberService.create(ACTOR_ID, createRequest())

        // then
        assertThat(response.id).isEqualTo(MEMBER_ID)
        verify { adminActionRecorder.record(ACTOR_ID, AdminActionType.CREATE_AI_MEMBER, MEMBER_ID) }
    }

    @Test
    fun `사진을 저장하면 수정 조치에 사진이라고 남긴다`() {
        // given
        val request = UpdateAiMemberPhotosRequest(publicPhotoKeys = listOf("members/0/public/a.webp"))

        // when
        adminAiMemberService.updatePhotos(ACTOR_ID, MEMBER_ID, request)

        // then
        verify { aiMemberService.updatePhotos(MEMBER_ID, listOf("members/0/public/a.webp"), emptyList()) }
        verify { adminActionRecorder.record(ACTOR_ID, AdminActionType.UPDATE_AI_MEMBER, MEMBER_ID, "PHOTOS") }
    }

    @Test
    fun `삭제하면 탈퇴 조치를 남긴다`() {
        // when
        adminAiMemberService.withdraw(ACTOR_ID, MEMBER_ID)

        // then
        verify { aiMemberService.withdraw(MEMBER_ID) }
        verify { adminActionRecorder.record(ACTOR_ID, AdminActionType.WITHDRAW_MEMBER, MEMBER_ID) }
    }

    private fun stubDetail() {
        every { aiPersonaRepository.findById(MEMBER_ID) } returns Optional.of(persona())
        every { memberRepository.findById(MEMBER_ID) } returns Optional.of(member())
        every { memberPhotoService.findProfilePhotos(MEMBER_ID) } returns mapOf(
            PhotoVisibility.PUBLIC to listOf(ProfilePhotoResponse("members/0/public/a.webp", "https://cdn/a.webp")),
            PhotoVisibility.SECRET to emptyList(),
        )
    }

    private fun createRequest() = CreateAiMemberRequest(
        nickname = "루나",
        gender = Gender.FEMALE,
        birthYear = 1998,
        latitude = 37.5,
        longitude = 127.0,
        persona = AiPersonaRequest(systemPrompt = "밝은 성격"),
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

    private fun statRow(replyCount: Long, tokenCount: Long) = object : AiReplyStatRow {
        override val aiMemberId = MEMBER_ID
        override val replyCount = replyCount
        override val tokenCount = tokenCount
    }

    private fun totalRow(replyCount: Long, tokenCount: Long) = object : AiReplyTotalRow {
        override val replyCount = replyCount
        override val tokenCount = tokenCount
    }

    private fun greetingRow(greetingCount: Long, greetingReplyCount: Long) = object : AiGreetingStatRow {
        override val aiMemberId = MEMBER_ID
        override val greetingCount = greetingCount
        override val greetingReplyCount = greetingReplyCount
    }

    private fun greetingTotalRow(greetingCount: Long, greetingReplyCount: Long) = object : AiGreetingTotalRow {
        override val greetingCount = greetingCount
        override val greetingReplyCount = greetingReplyCount
    }

    private fun row() = object : AdminAiMemberRow {
        override val id = MEMBER_ID
        override val nickname = "루나"
        override val gender = "FEMALE"
        override val birthYear = 1998
        override val enabled = true
        override val greetingEnabled = true
        override val publicPhotoCount = 1L
        override val locatedAt: Instant? = NOW
        override val createdAt = NOW
    }

    companion object {

        private const val ACTOR_ID = 1L
        private const val MEMBER_ID = 0L
        private val NOW: Instant = Instant.parse("2026-09-14T00:00:00Z")
        private val DAY_START: Instant = Instant.parse("2026-09-14T00:00:00+09:00")
    }
}
