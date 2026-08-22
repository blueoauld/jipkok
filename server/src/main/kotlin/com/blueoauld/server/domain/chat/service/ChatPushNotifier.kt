package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.entity.type.ChatMessageType
import com.blueoauld.server.domain.chat.event.ChatMessageSentEvent
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.push.service.PushMessages
import com.blueoauld.server.domain.push.service.PushService
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
import com.blueoauld.server.domain.suspension.service.MemberSuspensionService
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

private val log = KotlinLogging.logger {}

@Component
class ChatPushNotifier(

    private val pushService: PushService,
    private val memberRepository: MemberRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
    private val memberSuspensionService: MemberSuspensionService,
    private val pushMessages: PushMessages,
) {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun notifySent(event: ChatMessageSentEvent) {
        if (pushService.isConnected(event.receiverId)) {
            return
        }

        runCatching { send(event) }
            .onFailure { log.error(it) { "메시지 푸시를 보내지 못했다. receiverId=${event.receiverId}" } }
    }

    private fun send(event: ChatMessageSentEvent) {
        val receiver = chatRoomMemberRepository.findByRoomIdAndMemberId(event.message.roomId, event.receiverId)

        if (receiver?.notificationEnabled != true) {
            return
        }

        if (memberSuspensionService.isSuspended(event.receiverId, SuspensionType.SERVICE)) {
            return
        }

        val sender = memberRepository.findById(event.message.senderId).orElse(null) ?: return
        val locale = memberRepository.findLocaleById(event.receiverId) ?: MemberLocale.KO

        pushService.send(
            memberId = event.receiverId,
            title = sender.nickname,
            body = toBody(event, locale),
            data = mapOf(ROOM_ID_KEY to event.message.roomId.toString()),
            badge = chatRoomMemberRepository.sumUnreadCount(event.receiverId).toInt(),
            channelId = CHANNEL_ID,
            priority = HIGH_PRIORITY,
        )
    }

    private fun toBody(event: ChatMessageSentEvent, locale: MemberLocale) = when (event.message.type) {
        ChatMessageType.TEXT -> event.message.content.orEmpty()
        ChatMessageType.PHOTO -> pushMessages.get(locale, PHOTO_CODE)
        ChatMessageType.VIDEO -> pushMessages.get(locale, VIDEO_CODE)
    }

    companion object {

        private const val ROOM_ID_KEY = "roomId"
        private const val PHOTO_CODE = "push.chat.photo"
        private const val VIDEO_CODE = "push.chat.video"
        private const val CHANNEL_ID = "chat"
        private const val HIGH_PRIORITY = "high"
    }
}
