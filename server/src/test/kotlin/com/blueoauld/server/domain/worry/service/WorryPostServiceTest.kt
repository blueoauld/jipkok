package com.blueoauld.server.domain.worry.service

import com.blueoauld.server.domain.worry.dto.request.CreateWorryPostRequest
import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.type.WorryCategory
import com.blueoauld.server.domain.worry.entity.type.WorrySort
import com.blueoauld.server.domain.worry.repository.WorryPostLikeRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.*

class WorryPostServiceTest {

    private val worryPostRepository = mockk<WorryPostRepository>(relaxed = true)

    private val worryPostLikeRepository = mockk<WorryPostLikeRepository>(relaxed = true)

    private val worryPostService = WorryPostService(
        worryPostRepository,
        worryPostLikeRepository,
        Clock.fixed(NOW, ZoneOffset.UTC),
    )

    @BeforeEach
    fun setUp() {
        every { worryPostRepository.countByMemberIdBetween(any(), any(), any()) } returns 0
        every { worryPostRepository.saveAndFlush(any()) } answers { firstArg() }
    }

    @Test
    fun `고민을 저장한다`() {
        // given
        val saved = slot<WorryPost>()

        // when
        worryPostService.create(MEMBER_ID, CreateWorryPostRequest(WorryCategory.WORK, "이직 고민"))

        // then
        verify { worryPostRepository.saveAndFlush(capture(saved)) }
        assertThat(saved.captured.memberId).isEqualTo(MEMBER_ID)
        assertThat(saved.captured.category).isEqualTo(WorryCategory.WORK)
        assertThat(saved.captured.content).isEqualTo("이직 고민")
    }

    @Test
    fun `작성 수는 한국 시간 하루 기준으로 센다`() {
        // given
        val from = slot<Instant>()
        val to = slot<Instant>()
        every { worryPostRepository.countByMemberIdBetween(MEMBER_ID, capture(from), capture(to)) } returns 0

        // when
        worryPostService.create(MEMBER_ID, CreateWorryPostRequest(WorryCategory.WORK, "이직 고민"))

        // then
        assertThat(from.captured).isEqualTo(Instant.parse("2026-08-01T15:00:00Z"))
        assertThat(to.captured).isEqualTo(Instant.parse("2026-08-02T15:00:00Z"))
    }

    @Test
    fun `하루 작성 개수를 넘기면 실패한다`() {
        // given
        every {
            worryPostRepository.countByMemberIdBetween(MEMBER_ID, any(), any())
        } returns WorryPostService.DAILY_POST_LIMIT.toLong()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryPostService.create(MEMBER_ID, CreateWorryPostRequest(WorryCategory.WORK, "이직 고민"))
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.WORRY_DAILY_LIMIT)
        verify(exactly = 0) { worryPostRepository.saveAndFlush(any()) }
    }

    @Test
    fun `검색어는 앞뒤 공백을 떼고 부분 일치로 찾는다`() {
        // given
        val keyword = slot<String>()
        every { worryPostRepository.search(MEMBER_ID, capture(keyword), null, 20) } returns emptyList()

        // when
        worryPostService.search(MEMBER_ID, "  이직  ", null, 20)

        // then
        assertThat(keyword.captured).isEqualTo("%이직%")
    }

    @Test
    fun `검색어의 와일드카드는 이스케이프한다`() {
        // given
        val keyword = slot<String>()
        every { worryPostRepository.search(MEMBER_ID, capture(keyword), null, 20) } returns emptyList()

        // when
        worryPostService.search(MEMBER_ID, "100%", null, 20)

        // then
        assertThat(keyword.captured).isEqualTo("%100\\%%")
    }

    @Test
    fun `검색어가 한 글자면 찾지 않는다`() {
        // given

        // when
        val response = worryPostService.search(MEMBER_ID, "이", null, 20)

        // then
        assertThat(response.items).isEmpty()
        assertThat(response.nextCursor).isNull()
        verify(exactly = 0) { worryPostRepository.search(any(), any(), any(), any()) }
    }

    @Test
    fun `본인 글을 지우면 소프트 삭제된다`() {
        // given
        val post = post(MEMBER_ID)
        every { worryPostRepository.findById(POST_ID) } returns Optional.of(post)

        // when
        worryPostService.delete(MEMBER_ID, POST_ID)

        // then
        verify { worryPostRepository.delete(post) }
    }

    @Test
    fun `관리자 삭제는 작성자 검사 없이 지운다`() {
        // given
        val post = post(OTHER_MEMBER_ID)
        every { worryPostRepository.findById(POST_ID) } returns Optional.of(post)

        // when
        worryPostService.deleteByAdmin(POST_ID)

        // then
        verify { worryPostRepository.delete(post) }
    }

    @Test
    fun `남의 글은 지울 수 없다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.of(post(OTHER_MEMBER_ID))

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryPostService.delete(MEMBER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.NOT_WORRY_POST_AUTHOR)
        verify(exactly = 0) { worryPostRepository.delete(any()) }
    }

    @Test
    fun `없는 글을 지우면 실패한다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryPostService.delete(MEMBER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.WORRY_POST_NOT_FOUND)
    }

    @Test
    fun `분류를 고르면 이름으로 바꿔 넘긴다`() {
        // given

        // when
        worryPostService.find(MEMBER_ID, WorrySort.LATEST, WorryCategory.LOVE, null, 20)

        // then
        verify { worryPostRepository.findLatestFirst(MEMBER_ID, "LOVE", null, 20) }
    }

    @Test
    fun `분류를 비우면 전체를 준다`() {
        // given

        // when
        worryPostService.find(MEMBER_ID, WorrySort.LATEST, null, null, 20)

        // then
        verify { worryPostRepository.findLatestFirst(MEMBER_ID, null, null, 20) }
    }

    @Test
    fun `상세는 내 글 여부와 공감 여부를 담는다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.of(post(MEMBER_ID))
        every { worryPostLikeRepository.existsByPostIdAndMemberId(POST_ID, MEMBER_ID) } returns true

        // when
        val response = worryPostService.findDetail(MEMBER_ID, POST_ID)

        // then
        assertThat(response.mine).isTrue()
        assertThat(response.likedByMe).isTrue()
        assertThat(response.content).isEqualTo("고민 내용")
    }

    @Test
    fun `없는 글의 상세를 보면 실패한다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.empty()

        // when
        val exception = assertThrows(BusinessException::class.java) {
            worryPostService.findDetail(MEMBER_ID, POST_ID)
        }

        // then
        assertThat(exception.errorCode).isEqualTo(ErrorCode.WORRY_POST_NOT_FOUND)
    }

    @Test
    fun `공감순은 커서 글의 공감 수를 읽어 넘긴다`() {
        // given
        every { worryPostRepository.findLikeCountById(POST_ID) } returns 7

        // when
        worryPostService.find(MEMBER_ID, WorrySort.POPULAR, null, POST_ID, 20)

        // then
        verify { worryPostRepository.findMostLikedFirst(MEMBER_ID, null, 7, POST_ID, 20) }
    }

    @Test
    fun `공감순 커서 글이 사라졌으면 빈 페이지를 준다`() {
        // given
        every { worryPostRepository.findLikeCountById(POST_ID) } returns null

        // when
        val response = worryPostService.find(MEMBER_ID, WorrySort.POPULAR, null, POST_ID, 20)

        // then
        assertThat(response.items).isEmpty()
        assertThat(response.nextCursor).isNull()
        verify(exactly = 0) { worryPostRepository.findMostLikedFirst(any(), any(), any(), any(), any()) }
    }

    @Test
    fun `댓글순은 커서 글의 댓글 수를 읽어 넘긴다`() {
        // given
        every { worryPostRepository.findCommentCountById(POST_ID) } returns 3

        // when
        worryPostService.find(MEMBER_ID, WorrySort.COMMENT, null, POST_ID, 20)

        // then
        verify { worryPostRepository.findMostCommentedFirst(MEMBER_ID, null, 3, POST_ID, 20) }
    }

    private fun post(memberId: Long) =
        WorryPost(memberId = memberId, category = WorryCategory.WORK, content = "고민 내용")

    companion object {

        private const val MEMBER_ID = 1L
        private const val OTHER_MEMBER_ID = 2L
        private const val POST_ID = 10L

        private val NOW: Instant = Instant.parse("2026-08-02T05:37:12Z")
    }
}
