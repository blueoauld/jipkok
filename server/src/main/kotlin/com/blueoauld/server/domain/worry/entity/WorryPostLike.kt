package com.blueoauld.server.domain.worry.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

@Entity
@Table(
    name = "worry_post_like",
    indexes = [Index(name = "idx_worry_post_like_member_id", columnList = "member_id")],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_worry_post_like_post_id_member_id", columnNames = ["post_id", "member_id"]),
    ],
)
class WorryPostLike(

    @Column(name = "post_id", nullable = false, updatable = false)
    val postId: Long,

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
