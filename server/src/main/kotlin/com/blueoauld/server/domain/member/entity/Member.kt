package com.blueoauld.server.domain.member.entity

import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberRole
import com.blueoauld.server.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.SoftDelete
import org.hibernate.annotations.SoftDeleteType
import java.time.Instant

@SoftDelete(strategy = SoftDeleteType.TIMESTAMP, columnName = "deleted_at")
@Entity
@Table(name = "member")
class Member(

    @Column(name = "phone_number", nullable = false, unique = true, length = PHONE_NUMBER_LENGTH)
    val phoneNumber: String,

    @Column(name = "password", nullable = false)
    var password: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, updatable = false)
    val gender: Gender,

    @Column(name = "nickname", nullable = false, unique = true, length = NICKNAME_MAX_LENGTH)
    var nickname: String,

    @Column(name = "birth_year", nullable = false)
    var birthYear: Int,

    @Column(name = "comment", length = COMMENT_MAX_LENGTH)
    var comment: String? = null,

    @Column(name = "bio", length = BIO_MAX_LENGTH)
    var bio: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    val role: MemberRole = MemberRole.MEMBER,

    @Column(name = "latitude")
    var latitude: Double? = null,

    @Column(name = "longitude")
    var longitude: Double? = null,

    @Column(name = "located_at")
    var locatedAt: Instant? = null,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val PHONE_NUMBER_LENGTH = 11
        const val NICKNAME_MAX_LENGTH = 10
        const val NICKNAME_PATTERN = "^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]+$"
        const val COMMENT_MAX_LENGTH = 100
        const val BIO_MAX_LENGTH = 1000
    }
}
