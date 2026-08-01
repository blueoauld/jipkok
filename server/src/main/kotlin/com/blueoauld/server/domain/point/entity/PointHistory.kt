package com.blueoauld.server.domain.point.entity

import com.blueoauld.server.domain.point.entity.type.PointType
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
    name = "point_history",
    indexes = [
        Index(name = "idx_point_history_member_id_type_recorded_at", columnList = "member_id, type, recorded_at"),
        Index(name = "idx_point_history_member_id_id", columnList = "member_id, id"),
    ],
)
class PointHistory(

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, updatable = false)
    val type: PointType,

    @Column(name = "amount", nullable = false, updatable = false)
    val amount: Int,

    @Column(name = "balance_after", nullable = false, updatable = false)
    val balanceAfter: Int,

    @Column(name = "recorded_at", nullable = false, updatable = false)
    val recordedAt: Instant,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
