package com.blueoauld.server.domain.report.entity

import com.blueoauld.server.domain.photo.entity.PhotoUpload
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(
    name = "report_photo",
    indexes = [Index(name = "idx_report_photo_report_id", columnList = "report_id, display_order")],
)
class ReportPhoto(

    @Column(name = "report_id", nullable = false, updatable = false)
    val reportId: Long,

    @Column(name = "display_order", nullable = false)
    val displayOrder: Int,

    @Column(name = "object_key", nullable = false, length = PhotoUpload.OBJECT_KEY_MAX_LENGTH)
    val objectKey: String,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
