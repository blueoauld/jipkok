package com.blueoauld.server.domain.worry.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import org.hibernate.annotations.SoftDelete
import org.hibernate.annotations.SoftDeleteType

@SoftDelete(strategy = SoftDeleteType.TIMESTAMP, columnName = "deleted_at")
@Entity
@Table(
    name = "worry_comment",
    indexes = [
        Index(name = "idx_worry_comment_post_id_id", columnList = "post_id, id"),
        Index(name = "idx_worry_comment_member_id", columnList = "member_id"),
    ],
)
class WorryComment(

    @Column(name = "post_id", nullable = false, updatable = false)
    val postId: Long,

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "content", nullable = false, updatable = false, length = CONTENT_MAX_LENGTH)
    val content: String,

    @Column(name = "anonymous_no", nullable = false, updatable = false)
    val anonymousNo: Int,

    @Column(name = "deleted_by_report", nullable = false)
    var deletedByReport: Boolean = false,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val CONTENT_MAX_LENGTH = 200
    }
}
