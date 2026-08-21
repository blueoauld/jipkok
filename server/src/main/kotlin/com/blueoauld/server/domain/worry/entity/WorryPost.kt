package com.blueoauld.server.domain.worry.entity

import com.blueoauld.server.domain.worry.entity.type.WorryCategory
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
import org.hibernate.annotations.SoftDelete
import org.hibernate.annotations.SoftDeleteType

@SoftDelete(strategy = SoftDeleteType.TIMESTAMP, columnName = "deleted_at")
@Entity
@Table(
    name = "worry_post",
    indexes = [Index(name = "idx_worry_post_member_id_id", columnList = "member_id, id")],
)
class WorryPost(

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, updatable = false)
    val category: WorryCategory,

    @Column(name = "content", nullable = false, updatable = false, length = CONTENT_MAX_LENGTH)
    val content: String,

    @Column(name = "like_count", nullable = false)
    var likeCount: Int = 0,

    @Column(name = "comment_count", nullable = false)
    var commentCount: Int = 0,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val CONTENT_MAX_LENGTH = 500
    }
}
