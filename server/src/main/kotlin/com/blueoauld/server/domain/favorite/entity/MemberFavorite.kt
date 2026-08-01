package com.blueoauld.server.domain.favorite.entity

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
    name = "member_favorite",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_member_favorite_member_id_favorite_member_id",
            columnNames = ["member_id", "favorite_member_id"],
        ),
    ],
    indexes = [Index(name = "idx_member_favorite_favorite_member_id", columnList = "favorite_member_id")],
)
class MemberFavorite(

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "favorite_member_id", nullable = false, updatable = false)
    val favoriteMemberId: Long,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
