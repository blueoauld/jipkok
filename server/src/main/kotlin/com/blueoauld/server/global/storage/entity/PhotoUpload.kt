package com.blueoauld.server.global.storage.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(
    name = "photo_upload",
    indexes = [Index(name = "idx_photo_upload_issued_at", columnList = "issued_at")],
)
class PhotoUpload(

    @Column(name = "member_id", nullable = false)
    val memberId: Long,

    @Column(name = "object_key", nullable = false, unique = true, length = OBJECT_KEY_MAX_LENGTH)
    val objectKey: String,

    @Column(name = "issued_at", nullable = false)
    val issuedAt: Instant,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val OBJECT_KEY_MAX_LENGTH = 255
    }
}
