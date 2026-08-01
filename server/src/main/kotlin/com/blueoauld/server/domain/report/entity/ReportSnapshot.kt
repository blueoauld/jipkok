package com.blueoauld.server.domain.report.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes

@Entity
@Table(
    name = "report_snapshot",
    uniqueConstraints = [UniqueConstraint(name = "uk_report_snapshot_report_id", columnNames = ["report_id"])],
)
class ReportSnapshot(

    @Column(name = "report_id", nullable = false, updatable = false)
    val reportId: Long,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content", nullable = false, updatable = false)
    val content: String,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
