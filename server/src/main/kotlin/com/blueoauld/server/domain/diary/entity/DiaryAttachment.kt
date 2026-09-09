package com.blueoauld.server.domain.diary.entity

import com.blueoauld.server.domain.chat.entity.ChatMessage
import com.blueoauld.server.domain.diary.entity.type.DiaryAttachmentType
import com.blueoauld.server.domain.photo.entity.PhotoUpload
import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

@Entity
@Table(
    name = "diary_attachment",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_diary_attachment_object_key", columnNames = ["object_key"]),
    ],
    indexes = [Index(name = "idx_diary_attachment_diary_id", columnList = "diary_id")],
)
class DiaryAttachment(

    @Column(name = "diary_id", nullable = false, updatable = false)
    val diaryId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, updatable = false)
    val type: DiaryAttachmentType,

    @Column(name = "object_key", nullable = false, updatable = false, length = PhotoUpload.OBJECT_KEY_MAX_LENGTH)
    val objectKey: String,

    @Column(name = "thumbnail_object_key", updatable = false, length = PhotoUpload.OBJECT_KEY_MAX_LENGTH)
    val thumbnailObjectKey: String? = null,

    @Column(name = "duration_seconds", updatable = false)
    val durationSeconds: Int? = null,

    @Column(name = "position", nullable = false)
    var position: Int,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    fun objectKeys(): List<String> = listOfNotNull(objectKey, thumbnailObjectKey)

    companion object {

        const val MAX_PER_DIARY = 10
        const val VIDEO_MAX_SECONDS = ChatMessage.VIDEO_MAX_SECONDS
    }
}
