package com.blueoauld.server.domain.translation.service

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.translation.dto.request.TranslateRequest
import com.blueoauld.server.domain.translation.entity.Translation
import com.blueoauld.server.domain.translation.entity.type.TranslationSource
import com.blueoauld.server.domain.translation.repository.TranslationLimitCache
import com.blueoauld.server.domain.translation.repository.TranslationRepository
import com.blueoauld.server.domain.worry.entity.WorryPost
import com.blueoauld.server.domain.worry.entity.type.WorryCategory
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.dao.DataIntegrityViolationException
import java.util.*

class TranslationServiceTest {

    private val translationRepository = mockk<TranslationRepository>(relaxed = true)

    private val translationLimitCache = mockk<TranslationLimitCache>()

    private val memberRepository = mockk<MemberRepository>()

    private val worryPostRepository = mockk<WorryPostRepository>()

    private val worryCommentRepository = mockk<WorryCommentRepository>(relaxed = true)

    private val translator = mockk<Translator>()

    private val translationService = TranslationService(
        translationRepository,
        translationLimitCache,
        memberRepository,
        worryPostRepository,
        worryCommentRepository,
        translator,
    )

    @BeforeEach
    fun setUp() {
        every { memberRepository.findLocaleById(MEMBER_ID) } returns MemberLocale.JA
        every { translationLimitCache.increaseAndCount(MEMBER_ID) } returns 1
        justRun { translationLimitCache.decrease(MEMBER_ID) }
        every { translationRepository.findBySourceTypeAndSourceIdAndTargetLocale(any(), any(), any()) } returns null
        every { worryPostRepository.findById(POST_ID) } returns Optional.of(post())
        every { translator.translate(any(), any()) } returns TRANSLATED
        every { translationRepository.save(any<Translation>()) } answers { firstArg() }
    }

    @Test
    fun `번역해서 준다`() {
        // given, when
        val response = translationService.translate(MEMBER_ID, request())

        // then
        assertThat(response.content).isEqualTo(TRANSLATED)
        verify { translator.translate(CONTENT, MemberLocale.JA) }
    }

    @Test
    fun `번역한 것을 남긴다`() {
        // given, when
        translationService.translate(MEMBER_ID, request())

        // then
        verify { translationRepository.save(any<Translation>()) }
    }

    @Test
    fun `이미 번역한 것이 있으면 다시 부르지 않는다`() {
        // given
        every {
            translationRepository.findBySourceTypeAndSourceIdAndTargetLocale(
                TranslationSource.WORRY_POST,
                POST_ID,
                MemberLocale.JA,
            )
        } returns Translation(TranslationSource.WORRY_POST, POST_ID, MemberLocale.JA, CACHED)

        // when
        val response = translationService.translate(MEMBER_ID, request())

        // then
        assertThat(response.content).isEqualTo(CACHED)
        verify(exactly = 0) { translator.translate(any(), any()) }
    }

    @Test
    fun `캐시가 있으면 한도를 쓰지 않는다`() {
        // given
        every { translationRepository.findBySourceTypeAndSourceIdAndTargetLocale(any(), any(), any()) } returns
            Translation(TranslationSource.WORRY_POST, POST_ID, MemberLocale.JA, CACHED)

        // when
        translationService.translate(MEMBER_ID, request())

        // then
        verify(exactly = 0) { translationLimitCache.increaseAndCount(any()) }
    }

    @Test
    fun `하루 한도를 넘기면 막는다`() {
        // given
        every { translationLimitCache.increaseAndCount(MEMBER_ID) } returns
            TranslationLimitCache.DAILY_LIMIT + 1

        // when, then
        assertThatThrownBy { translationService.translate(MEMBER_ID, request()) }
            .isInstanceOf(BusinessException::class.java)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TRANSLATE_LIMIT_EXCEEDED)
    }

    @Test
    fun `언어를 모르면 한국어로 번역한다`() {
        // given
        every { memberRepository.findLocaleById(MEMBER_ID) } returns null

        // when
        translationService.translate(MEMBER_ID, request())

        // then
        verify { translator.translate(CONTENT, MemberLocale.KO) }
    }

    @Test
    fun `없는 글은 번역하지 않는다`() {
        // given
        every { worryPostRepository.findById(POST_ID) } returns Optional.empty()

        // when, then
        assertThatThrownBy { translationService.translate(MEMBER_ID, request()) }
            .isInstanceOf(BusinessException::class.java)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.WORRY_POST_NOT_FOUND)
        verify(exactly = 0) { translationLimitCache.increaseAndCount(any()) }
    }

    @Test
    fun `번역기가 실패하면 쓴 한도를 되돌린다`() {
        // given
        every { translator.translate(any(), any()) } throws BusinessException(ErrorCode.TRANSLATE_FAILED)

        // when, then
        assertThatThrownBy { translationService.translate(MEMBER_ID, request()) }
            .isInstanceOf(BusinessException::class.java)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TRANSLATE_FAILED)
        verify { translationLimitCache.decrease(MEMBER_ID) }
        verify(exactly = 0) { translationRepository.save(any<Translation>()) }
    }

    @Test
    fun `같은 글을 동시에 번역해 저장이 부딪혀도 번역문을 준다`() {
        // given
        every { translationRepository.save(any<Translation>()) } throws
            DataIntegrityViolationException("uk_translation_source_target")

        // when
        val response = translationService.translate(MEMBER_ID, request())

        // then
        assertThat(response.content).isEqualTo(TRANSLATED)
    }

    @Test
    fun `저장이 다른 이유로 실패하면 감추지 않는다`() {
        // given
        every { translationRepository.save(any<Translation>()) } throws IllegalStateException("끊김")

        // when, then
        assertThatThrownBy { translationService.translate(MEMBER_ID, request()) }
            .isInstanceOf(IllegalStateException::class.java)
    }

    private fun request() = TranslateRequest(TranslationSource.WORRY_POST, POST_ID)

    private fun post() = WorryPost(
        memberId = 1L,
        category = WorryCategory.ETC,
        content = CONTENT,
    )

    companion object {

        private const val MEMBER_ID = 7L
        private const val POST_ID = 42L
        private const val CONTENT = "고민 내용"
        private const val TRANSLATED = "翻訳された内容"
        private const val CACHED = "이미 번역된 것"
    }
}
