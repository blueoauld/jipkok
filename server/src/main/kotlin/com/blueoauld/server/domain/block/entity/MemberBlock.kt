package com.blueoauld.server.domain.block.entity

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
    name = "member_block",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_member_block_blocker_id_blocked_member_id",
            columnNames = ["blocker_id", "blocked_member_id"],
        ),
    ],
    indexes = [
        Index(
            name = "idx_member_block_blocked_member_id_blocker_id",
            columnList = "blocked_member_id, blocker_id",
        ),
    ],
)
class MemberBlock(

    @Column(name = "blocker_id", nullable = false, updatable = false)
    val blockerId: Long,

    @Column(name = "blocked_member_id", nullable = false, updatable = false)
    val blockedMemberId: Long,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
