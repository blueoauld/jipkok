package com.blueoauld.server.domain.access.entity

import com.blueoauld.server.domain.member.entity.Member
import com.blueoauld.server.domain.push.entity.type.DevicePlatform
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.LocalDate

@Entity
@Table(
    name = "access_reward",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_access_reward_phone_number_accessed_on",
            columnNames = ["phone_number", "accessed_on"],
        ),
    ],
)
class AccessReward(

    @Column(name = "phone_number", nullable = false, updatable = false, length = Member.PHONE_NUMBER_LENGTH)
    val phoneNumber: String,

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false, updatable = false)
    val platform: DevicePlatform,

    @Column(name = "device_name", updatable = false, length = AccessLog.DEVICE_NAME_MAX_LENGTH)
    val deviceName: String?,

    @Column(name = "ip_address", nullable = false, updatable = false, length = AccessLog.IP_ADDRESS_MAX_LENGTH)
    val ipAddress: String,

    @Column(name = "accessed_on", nullable = false, updatable = false)
    val accessedOn: LocalDate,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0
}
