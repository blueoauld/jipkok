package com.blueoauld.server.domain.like.entity

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
    name = "member_like",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_member_like_liker_id_liked_member_id",
            columnNames = ["liker_id", "liked_member_id"],
        ),
    ],
    indexes = [Index(name = "idx_member_like_liked_member_id", columnList = "liked_member_id")],
)
class MemberLike(

    @Column(name = "liker_id", nullable = false, updatable = false)
    val likerId: Long,

    @Column(name = "liked_member_id", nullable = false, updatable = false)
    val likedMemberId: Long,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
