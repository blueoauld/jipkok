package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.MemberPhoto
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class MemberSummaryServiceTest {

    private val memberRepository = mockk<MemberRepository>()

    private val memberPhotoRepository = mockk<MemberPhotoRepository>()

    private val photoStorage = mockk<PhotoStorage>()

    private val service = MemberSummaryService(
        memberRepository,
        memberPhotoRepository,
        photoStorage,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @Test
    fun `요청한 순서대로 요약을 만들고 없는 회원은 건너뛴다`() {
        // given
        every { memberRepository.findAllById(listOf(2L, 9L, 1L)) } returns listOf(member(1L, 1998), member(2L, 2000))
        every { memberPhotoRepository.findAllByMemberIdIn(any()) } returns emptyList()

        // when
        val summaries = service.findSummaries(listOf(2L, 9L, 1L))

        // then
        assertThat(summaries.map { it.memberId }).containsExactly(2L, 1L)
        assertThat(summaries.map { it.age }).containsExactly(26, 28)
    }

    @Test
    fun `공개 사진 중 첫 번째를 프로필 사진으로 쓴다`() {
        // given
        every { memberRepository.findAllById(listOf(1L)) } returns listOf(member(1L, 1998))
        every { memberPhotoRepository.findAllByMemberIdIn(listOf(1L)) } returns listOf(
            MemberPhoto(1L, PhotoVisibility.SECRET, 0, "members/1/secret/s.jpg"),
            MemberPhoto(1L, PhotoVisibility.PUBLIC, 1, "members/1/public/second.jpg"),
            MemberPhoto(1L, PhotoVisibility.PUBLIC, 0, "members/1/public/first.jpg"),
        )
        every { photoStorage.toPublicUrl("members/1/public/first.jpg") } returns "https://cdn/first.jpg"

        // when
        val summary = service.findSummaries(listOf(1L)).single()

        // then
        assertThat(summary.profileImageUrl).isEqualTo("https://cdn/first.jpg")
    }

    @Test
    fun `공개 사진이 없으면 프로필 사진도 없다`() {
        // given
        every { memberRepository.findAllById(listOf(1L)) } returns listOf(member(1L, 1998))
        every { memberPhotoRepository.findAllByMemberIdIn(listOf(1L)) } returns listOf(
            MemberPhoto(1L, PhotoVisibility.SECRET, 0, "members/1/secret/s.jpg"),
        )

        // when
        val summary = service.findSummaries(listOf(1L)).single()

        // then
        assertThat(summary.profileImageUrl).isNull()
    }

    @Test
    fun `빈 목록이면 조회하지 않는다`() {
        // when
        val summaries = service.findSummaries(emptyList())

        // then
        assertThat(summaries).isEmpty()
        verify(exactly = 0) { memberRepository.findAllById(any()) }
    }

    private fun member(id: Long, birthYear: Int) = Member(
        phoneNumber = "+82101234${id.toString().padStart(4, '0')}",
        password = "encoded",
        gender = Gender.MALE,
        nickname = "회원$id",
        birthYear = birthYear,
    ).also { member ->
        Member::class.java.getDeclaredField("id").apply {
            isAccessible = true
            set(member, id)
        }
    }

    companion object {

        private val NOW: Instant = Instant.parse("2026-08-01T00:00:00Z")
    }
}
