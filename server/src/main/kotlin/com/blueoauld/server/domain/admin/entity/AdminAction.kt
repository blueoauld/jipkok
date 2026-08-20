package com.blueoauld.server.domain.admin.entity

import com.blueoauld.server.domain.admin.entity.type.AdminActionType
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

@Entity
@Table(
    name = "admin_action",
    indexes = [Index(name = "idx_admin_action_created_at", columnList = "created_at")],
)
class AdminAction(

    @Column(name = "actor_id", nullable = false, updatable = false)
    val actorId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, updatable = false)
    val action: AdminActionType,

    @Column(name = "target_id", nullable = false, updatable = false)
    val targetId: Long,

    @Column(name = "detail", length = DETAIL_MAX_LENGTH, updatable = false)
    val detail: String? = null,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val DETAIL_MAX_LENGTH = 500
    }
}
