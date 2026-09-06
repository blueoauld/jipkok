package com.blueoauld.server.domain.appleads.entity

import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "apple_ads_campaign")
class AppleAdsCampaign(

    @Id
    @Column(name = "id")
    val id: Long,

    @Column(name = "name", nullable = false, length = NAME_MAX_LENGTH)
    val name: String,

    @Column(name = "status", length = STATUS_MAX_LENGTH)
    val status: String?,

    @Column(name = "deleted", nullable = false)
    val deleted: Boolean,
) : BaseEntity() {

    companion object {

        const val NAME_MAX_LENGTH = 200
        const val STATUS_MAX_LENGTH = 20
    }
}
