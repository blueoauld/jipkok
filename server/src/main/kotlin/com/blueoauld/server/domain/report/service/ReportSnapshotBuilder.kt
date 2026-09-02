package com.blueoauld.server.domain.report.service

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.chat.repository.ChatMessageRepository
import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.member.entity.displayOrdered
import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.report.dto.ChatMessageSnapshot
import com.blueoauld.server.domain.report.dto.ReportSnapshotContent
import com.blueoauld.server.domain.report.dto.ReportedMemberSnapshot
import com.blueoauld.server.domain.report.dto.ReporterSnapshot
import com.blueoauld.server.domain.report.event.PhotoCopy
import com.blueoauld.server.domain.report.event.ReportPhotosCopiedEvent
import org.springframework.data.domain.Limit
import org.springframework.stereotype.Component

@Component
class ReportSnapshotBuilder(

    private val memberPhotoRepository: MemberPhotoRepository,
    private val chatMessageRepository: ChatMessageRepository,
) {

    fun build(reportId: Long, reporter: Member, reported: Member, roomId: Long?): BuiltSnapshot {
        val profilePhotoKeys = findPublicPhotoKeys(reported.id)
        val messages = roomId?.let { findMessages(it) } ?: emptyList()

        return BuiltSnapshot(
            content = toContent(reportId, reporter, reported, profilePhotoKeys, messages),
            photosCopiedEvent = toPhotosCopiedEvent(reportId, profilePhotoKeys, messages),
        )
    }

    private fun findMessages(roomId: Long) =
        chatMessageRepository.findByRoomIdAndIdLessThanOrderByIdDesc(roomId, Long.MAX_VALUE, Limit.of(MESSAGE_COUNT))
            .asReversed()

    private fun findPublicPhotoKeys(reportedMemberId: Long) =
        memberPhotoRepository.findAllByMemberId(reportedMemberId)
            .displayOrdered(PhotoVisibility.PUBLIC)
            .map { it.objectKey }

    private fun toContent(
        reportId: Long,
        reporter: Member,
        reported: Member,
        profilePhotoKeys: List<String>,
        messages: List<ChatMessage>,
    ) = ReportSnapshotContent(
        reporter = ReporterSnapshot(reporter.id, reporter.nickname),
        reported = ReportedMemberSnapshot(
            memberId = reported.id,
            phoneNumber = reported.phoneNumber,
            nickname = reported.nickname,
            gender = reported.gender,
            birthYear = reported.birthYear,
            comment = reported.comment,
            bio = reported.bio,
            photoKeys = profilePhotoKeys.map { snapshotKeyOf(reportId, it) },
        ),
        messages = messages.map { message ->
            ChatMessageSnapshot(
                messageId = message.id,
                senderId = message.senderId,
                type = message.type,
                content = message.content,
                photoKey = message.objectKey?.let { snapshotKeyOf(reportId, it) },
                createdAt = message.createdAt,
            )
        },
    )

    private fun toPhotosCopiedEvent(
        reportId: Long,
        profilePhotoKeys: List<String>,
        messages: List<ChatMessage>,
    ) = ReportPhotosCopiedEvent(
        reportId = reportId,
        copies = (profilePhotoKeys + messages.mapNotNull { it.objectKey })
            .map { PhotoCopy(it, snapshotKeyOf(reportId, it)) },
    )

    private fun snapshotKeyOf(reportId: Long, objectKey: String) =
        "$SNAPSHOT_KEY_ROOT/$reportId/${objectKey.substringAfterLast('/')}"

    data class BuiltSnapshot(

        val content: ReportSnapshotContent,
        val photosCopiedEvent: ReportPhotosCopiedEvent,
    )

    companion object {

        private const val MESSAGE_COUNT = 50

        private const val SNAPSHOT_KEY_ROOT = "reports/snapshot"
    }
}
