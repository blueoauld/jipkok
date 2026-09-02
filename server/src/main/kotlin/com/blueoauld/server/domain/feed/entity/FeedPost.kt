package com.blueoauld.server.domain.feed.entity

import com.blueoauld.server.domain.photo.entity.PhotoUpload
import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import org.hibernate.annotations.SoftDelete
import org.hibernate.annotations.SoftDeleteType
import java.time.Instant

@SoftDelete(strategy = SoftDeleteType.TIMESTAMP, columnName = "deleted_at")
@Entity
@Table(
    name = "feed_post",
    indexes = [Index(name = "idx_feed_post_member_id_id", columnList = "member_id, id")],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_feed_post_member_id_slot_at", columnNames = ["member_id", "slot_at"]),
    ],
)
class FeedPost(

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "slot_at", nullable = false, updatable = false)
    val slotAt: Instant,

    @Column(name = "object_key", nullable = false, updatable = false, length = PhotoUpload.OBJECT_KEY_MAX_LENGTH)
    val objectKey: String,

    @Column(name = "caption", length = CAPTION_MAX_LENGTH)
    val caption: String? = null,

    @Column(name = "like_count", nullable = false)
    var likeCount: Int = 0,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val CAPTION_MAX_LENGTH = 30
    }
}
