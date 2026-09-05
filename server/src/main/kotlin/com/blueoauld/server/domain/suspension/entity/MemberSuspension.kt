package com.blueoauld.server.domain.suspension.entity

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.suspension.entity.type.SuspensionReason
import com.blueoauld.server.domain.suspension.entity.type.SuspensionType
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
import java.time.Instant

@Entity
@Table(
    name = "member_suspension",
    indexes = [Index(name = "idx_member_suspension_phone_number_type", columnList = "phone_number, type")],
)
class MemberSuspension(

    @Column(name = "phone_number", nullable = false, updatable = false, length = Member.PHONE_NUMBER_LENGTH)
    val phoneNumber: String,

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "nickname", nullable = false, updatable = false, length = Member.NICKNAME_MAX_LENGTH)
    val nickname: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, updatable = false)
    val type: SuspensionType,

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, updatable = false)
    val reason: SuspensionReason,

    @Column(name = "started_at", nullable = false, updatable = false)
    val startedAt: Instant,

    @Column(name = "expires_at", updatable = false)
    val expiresAt: Instant? = null,

    @Column(name = "detail", length = DETAIL_MAX_LENGTH)
    val detail: String? = null,

    @Column(name = "released_at")
    var releasedAt: Instant? = null,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    fun isActive(now: Instant) = releasedAt == null && expiresAt?.isAfter(now) != false

    companion object {

        const val DETAIL_MAX_LENGTH = 500
    }
}
