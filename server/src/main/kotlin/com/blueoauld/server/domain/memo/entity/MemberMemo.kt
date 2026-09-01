package com.blueoauld.server.domain.memo.entity

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
    name = "member_memo",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_member_memo_owner_id_target_id", columnNames = ["owner_id", "target_id"]),
    ],
    indexes = [Index(name = "idx_member_memo_target_id", columnList = "target_id")],
)
class MemberMemo(

    @Column(name = "owner_id", nullable = false, updatable = false)
    val ownerId: Long,

    @Column(name = "target_id", nullable = false, updatable = false)
    val targetId: Long,

    @Column(name = "content", nullable = false, length = CONTENT_MAX_LENGTH)
    var content: String,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val CONTENT_MAX_LENGTH = 100
    }
}
