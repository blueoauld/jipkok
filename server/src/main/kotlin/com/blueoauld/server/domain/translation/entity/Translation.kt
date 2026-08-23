package com.blueoauld.server.domain.translation.entity

import com.blueoauld.server.domain.member.entity.type.MemberLocale
import com.blueoauld.server.domain.translation.entity.type.TranslationSource
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import org.hibernate.annotations.CreationTimestamp
import java.time.Instant

@Entity
@Table(
    name = "translation",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_translation_source_target",
            columnNames = ["source_type", "source_id", "target_locale"],
        ),
    ],
)
class Translation(

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, updatable = false, length = SOURCE_TYPE_LENGTH)
    val sourceType: TranslationSource,

    @Column(name = "source_id", nullable = false, updatable = false)
    val sourceId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "target_locale", nullable = false, updatable = false, length = TARGET_LOCALE_LENGTH)
    val targetLocale: MemberLocale,

    @Column(name = "content", nullable = false, updatable = false, columnDefinition = "TEXT")
    val content: String,
) {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    val id: Long = 0

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.EPOCH
        protected set

    companion object {

        private const val SOURCE_TYPE_LENGTH = 20
        private const val TARGET_LOCALE_LENGTH = 16
    }
}
