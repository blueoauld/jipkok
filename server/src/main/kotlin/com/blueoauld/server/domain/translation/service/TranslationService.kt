package com.blueoauld.server.domain.translation.service

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.translation.dto.request.TranslateRequest
import com.blueoauld.server.domain.translation.dto.response.TranslationResponse
import com.blueoauld.server.domain.translation.entity.Translation
import com.blueoauld.server.domain.translation.entity.type.TranslationSource
import com.blueoauld.server.domain.translation.repository.TranslationLimitCache
import com.blueoauld.server.domain.translation.repository.TranslationRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service

@Service
class TranslationService(

    private val translationRepository: TranslationRepository,
    private val translationLimitCache: TranslationLimitCache,
    private val memberRepository: MemberRepository,
    private val worryPostRepository: WorryPostRepository,
    private val worryCommentRepository: WorryCommentRepository,
    private val translator: Translator,
) {

    fun translate(memberId: Long, request: TranslateRequest): TranslationResponse {
        val targetLocale = memberRepository.findLocaleById(memberId) ?: MemberLocale.KO
        val cached = translationRepository.findBySourceTypeAndSourceIdAndTargetLocale(
            request.sourceType,
            request.sourceId,
            targetLocale,
        )

        if (cached != null) {
            return TranslationResponse(cached.content)
        }

        if (translationLimitCache.increaseAndCount(memberId) > TranslationLimitCache.DAILY_LIMIT) {
            throw BusinessException(ErrorCode.TRANSLATE_LIMIT_EXCEEDED)
        }

        val source = sourceContentOf(request)
        val translated = translator.translate(source, targetLocale)

        runCatching {
            translationRepository.save(
                Translation(request.sourceType, request.sourceId, targetLocale, translated),
            )
        }.onFailure { if (it !is DataIntegrityViolationException) throw it }

        return TranslationResponse(translated)
    }

    private fun sourceContentOf(request: TranslateRequest): String = when (request.sourceType) {
        TranslationSource.WORRY_POST ->
            worryPostRepository.findById(request.sourceId)
                .orElseThrow { BusinessException(ErrorCode.WORRY_POST_NOT_FOUND) }
                .content

        TranslationSource.WORRY_COMMENT ->
            worryCommentRepository.findById(request.sourceId)
                .orElseThrow { BusinessException(ErrorCode.WORRY_COMMENT_NOT_FOUND) }
                .content
    }
}
