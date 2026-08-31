package com.blueoauld.server.domain.chat.service

import com.blueoauld.server.domain.chat.repository.ChatMessageReactionRepository
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomMemberRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.global.storage.event.PhotosDeletedEvent
import com.blueoauld.server.global.time.KOREA_ID
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.context.ApplicationEventPublisher
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class ChatRoomCleaner(

    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
    private val chatMessageRepository: ChatMessageRepository,
    private val chatMessageReactionRepository: ChatMessageReactionRepository,
    private val eventPublisher: ApplicationEventPublisher,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA_ID)
    @Transactional
    fun cleanUpLeftRooms() {
        val roomIds = chatRoomRepository.findIdsDeletedBefore(clock.instant().minus(RETENTION))

        if (roomIds.isEmpty()) {
            return
        }

        val objectKeys = chatMessageRepository.findObjectKeysByRoomIdIn(roomIds) +
            chatMessageRepository.findThumbnailKeysByRoomIdIn(roomIds)

        chatMessageReactionRepository.deleteByRoomIdIn(roomIds)
        chatMessageRepository.deleteByRoomIdIn(roomIds)
        chatRoomMemberRepository.deleteByRoomIdIn(roomIds)
        chatRoomRepository.deleteAllByIdIn(roomIds)

        if (objectKeys.isNotEmpty()) {
            eventPublisher.publishEvent(PhotosDeletedEvent(objectKeys))
        }

        log.info { "나간 채팅방 ${roomIds.size}건을 정리했다." }
    }

    companion object {

        val RETENTION: Duration = Duration.ofDays(90)

        private const val CLEAN_UP_CRON = "0 30 4 * * *"
    }
}
