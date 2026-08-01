package com.blueoauld.server.domain.secretphoto.entity

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
    name = "secret_photo_access",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_secret_photo_access_owner_id_viewer_id",
            columnNames = ["owner_id", "viewer_id"],
        ),
    ],
    indexes = [Index(name = "idx_secret_photo_access_viewer_id", columnList = "viewer_id")],
)
class SecretPhotoAccess(

    @Column(name = "owner_id", nullable = false, updatable = false)
    val ownerId: Long,

    @Column(name = "viewer_id", nullable = false, updatable = false)
    val viewerId: Long,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
