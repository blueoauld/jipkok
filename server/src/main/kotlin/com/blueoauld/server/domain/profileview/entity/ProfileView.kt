package com.blueoauld.server.domain.profileview.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant

@Entity
@Table(
    name = "profile_view",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_profile_view_viewer_id_viewed_member_id",
            columnNames = ["viewer_id", "viewed_member_id"],
        ),
    ],
    indexes = [
        Index(
            name = "idx_profile_view_viewed_member_id_viewed_at_id",
            columnList = "viewed_member_id, viewed_at, id",
        ),
    ],
)
class ProfileView(

    @Column(name = "viewer_id", nullable = false, updatable = false)
    val viewerId: Long,

    @Column(name = "viewed_member_id", nullable = false, updatable = false)
    val viewedMemberId: Long,

    @Column(name = "viewed_at", nullable = false)
    var viewedAt: Instant,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
