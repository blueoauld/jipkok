package com.blueoauld.server.domain.access.entity

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
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
import jakarta.persistence.UniqueConstraint
import java.time.LocalDate

@Entity
@Table(
    name = "access_log",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_access_log_member_id_accessed_on",
            columnNames = ["member_id", "accessed_on"],
        ),
    ],
    indexes = [Index(name = "idx_access_log_created_at", columnList = "created_at")],
)
class AccessLog(

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Column(name = "phone_number", nullable = false, updatable = false, length = Member.PHONE_NUMBER_LENGTH)
    val phoneNumber: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false, updatable = false)
    val platform: DevicePlatform,

    @Column(name = "device_name", updatable = false, length = AccessReward.DEVICE_NAME_MAX_LENGTH)
    val deviceName: String?,

    @Column(name = "ip_address", nullable = false, updatable = false, length = AccessReward.IP_ADDRESS_MAX_LENGTH)
    val ipAddress: String,

    @Column(name = "accessed_on", nullable = false, updatable = false)
    val accessedOn: LocalDate,

    @Column(name = "app_version", length = APP_VERSION_MAX_LENGTH, updatable = false)
    val appVersion: String? = null,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val APP_VERSION_MAX_LENGTH = 20
    }
}
