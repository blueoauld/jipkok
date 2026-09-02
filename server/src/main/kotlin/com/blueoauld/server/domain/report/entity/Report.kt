package com.blueoauld.server.domain.report.entity

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.report.entity.type.ReportReason
import com.blueoauld.server.domain.report.entity.type.ReportType
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
    name = "report",
    indexes = [
        Index(name = "idx_report_reported_member_id", columnList = "reported_member_id"),
        Index(name = "idx_report_handled_at", columnList = "handled_at"),
        Index(name = "idx_report_reported_phone_number", columnList = "reported_phone_number"),
    ],
)
class Report(

    @Column(name = "reporter_id", nullable = false, updatable = false)
    val reporterId: Long,

    @Column(name = "reported_member_id", nullable = false, updatable = false)
    val reportedMemberId: Long,

    @Column(name = "reported_phone_number", length = Member.PHONE_NUMBER_LENGTH, updatable = false)
    val reportedPhoneNumber: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, updatable = false)
    val type: ReportType,

    @Column(name = "room_id", updatable = false)
    val roomId: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, updatable = false)
    val reason: ReportReason,

    @Column(name = "detail", length = DETAIL_MAX_LENGTH, updatable = false)
    val detail: String? = null,

    @Column(name = "handled_at")
    var handledAt: Instant? = null,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val DETAIL_MAX_LENGTH = 1000
        const val PHOTO_MAX_COUNT = 6
    }
}
