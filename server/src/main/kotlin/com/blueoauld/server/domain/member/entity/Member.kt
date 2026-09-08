package com.blueoauld.server.domain.member.entity

import com.blueoauld.server.domain.member.entity.type.Gender
import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.member.entity.type.MemberRole
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
import org.hibernate.annotations.SoftDelete
import org.hibernate.annotations.SoftDeleteType
import java.time.Instant
import java.util.*

@SoftDelete(strategy = SoftDeleteType.TIMESTAMP, columnName = "deleted_at")
@Entity
@Table(
    name = "member",
    indexes = [
        Index(name = "idx_member_created_at", columnList = "created_at"),
    ],
)
class Member(

    @Column(name = "phone_number", nullable = false, length = PHONE_NUMBER_LENGTH)
    val phoneNumber: String,

    @Column(name = "password", nullable = false)
    var password: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, updatable = false)
    val gender: Gender,

    @Column(name = "nickname", nullable = false, length = NICKNAME_MAX_LENGTH)
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

    @Enumerated(EnumType.STRING)
    @Column(name = "locale", nullable = false)
    var locale: MemberLocale = MemberLocale.DEFAULT,

    @Column(name = "latitude")
    var latitude: Double? = null,

    @Column(name = "longitude")
    var longitude: Double? = null,

    @Column(name = "located_at")
    var locatedAt: Instant? = null,

    @Column(name = "received_like_count", nullable = false)
    var receivedLikeCount: Int = 0,

    @Column(name = "point_balance", nullable = false)
    var pointBalance: Int = 0,

    @Column(name = "note_receive_enabled", nullable = false)
    var noteReceiveEnabled: Boolean = true,

    @Column(name = "feed_notification_enabled", nullable = false)
    var feedNotificationEnabled: Boolean = true,

    @Column(name = "profile_views_seen_at")
    var profileViewsSeenAt: Instant? = null,
) : BaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    companion object {

        const val BLOCKED_TEXT = "부적절한 내용입니다."
        const val PHONE_NUMBER_LENGTH = 16
        const val NICKNAME_MAX_LENGTH = 10
        const val PHONE_NUMBER_PATTERN = "^(\\+8210|\\+81[789]0|\\+8869)\\d{8}$"
        const val NICKNAME_PATTERN = "^[가-힣ㄱ-ㅎㅏ-ㅣぁ-ゖァ-ヺー々一-龯a-zA-Z0-9 ]+$"
        const val COMMENT_MAX_LENGTH = 100
        const val BIO_MAX_LENGTH = 1000
        const val PASSWORD_MIN_LENGTH = 8
        const val PASSWORD_MAX_LENGTH = 30
        const val MIN_AGE = 19
        const val MAX_AGE = 90

        fun generateNickname() = UUID.randomUUID().toString().replace("-", "").take(NICKNAME_MAX_LENGTH)
    }
}
