package com.blueoauld.server.domain.ai.service

import com.blueoauld.server.domain.ai.dto.AiPhotoCounts
import com.blueoauld.server.domain.ai.dto.AiReply
import com.blueoauld.server.domain.ai.dto.AiReplyContext
import com.blueoauld.server.domain.ai.dto.request.AiTestChatRequest
import com.blueoauld.server.domain.ai.dto.request.AiTestChatRole
import com.blueoauld.server.domain.ai.repository.AiPersonaRepository
import com.blueoauld.server.domain.ai.repository.getPersona
import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import com.blueoauld.server.global.time.currentYear
import org.springframework.stereotype.Service
import java.time.Clock

@Service
class AiTestChatService(

    private val aiPersonaRepository: AiPersonaRepository,
    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val aiReplyGenerator: AiReplyGenerator,
    private val clock: Clock,
) {

    fun chat(memberId: Long, request: AiTestChatRequest): AiReply {
        val persona = aiPersonaRepository.getPersona(memberId)
        val ai = memberRepository.getMember(memberId)
        val partner = Member(
            phoneNumber = "",
            password = "",
            gender = if (ai.gender == Gender.MALE) Gender.FEMALE else Gender.MALE,
            nickname = PARTNER_NICKNAME,
            birthYear = clock.currentYear() - PARTNER_AGE,
            locale = request.locale,
        )
        val messages = request.messages.map {
            ChatMessage(
                roomId = TEST_ROOM_ID,
                senderId = if (it.role == AiTestChatRole.AI) ai.id else partner.id,
                type = ChatMessageType.TEXT,
                content = it.content.trim(),
            )
        }
        val context = AiReplyContext(
            ai = ai,
            systemPrompt = request.systemPrompt?.trim()?.ifEmpty { null } ?: persona.systemPrompt,
            partner = partner,
            messages = messages,
            language = detectLanguage(messages, ai.id, request.locale),
            now = clock.instant(),
            aiPhotos = AiPhotoCounts.of(memberPhotoRepository.findAllByMemberId(ai.id)),
        )

        val reply = aiReplyGenerator.generate(context) ?: throw BusinessException(ErrorCode.AI_REPLY_UNAVAILABLE)

        return reply.copy(content = splitBubbles(reply.content).joinToString("\n"))
    }

    companion object {

        const val PARTNER_NICKNAME = "테스터"
        const val PARTNER_AGE = 30

        private const val TEST_ROOM_ID = 0L
    }
}
