package com.blueoauld.server.domain.member.entity

import com.blueoauld.server.domain.member.entity.type.PhotoVisibility
import com.blueoauld.server.global.storage.PhotoUpload
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
    name = "member_photo",
    indexes = [
        Index(
            name = "idx_member_photo_member_id_visibility_display_order",
            columnList = "member_id, visibility, display_order",
        ),
    ],
)
class MemberPhoto(

    @Column(name = "member_id", nullable = false)
    val memberId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false)
    val visibility: PhotoVisibility,

    @Column(name = "display_order", nullable = false)
    val displayOrder: Int,

    @Column(name = "object_key", nullable = false, length = PhotoUpload.OBJECT_KEY_MAX_LENGTH)
    val objectKey: String,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val MAX_COUNT_PER_VISIBILITY = 6
    }
}
