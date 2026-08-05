package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.member.repository.MemberPhotoRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.NicknameHistoryRepository
import com.blueoauld.server.global.storage.service.PhotoStorage
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration

private val log = KotlinLogging.logger {}

@Component
class MemberCleaner(

    private val memberRepository: MemberRepository,
    private val memberPhotoRepository: MemberPhotoRepository,
    private val nicknameHistoryRepository: NicknameHistoryRepository,
    private val photoStorage: PhotoStorage,
    private val clock: Clock,
) {

    @Scheduled(cron = CLEAN_UP_CRON, zone = KOREA)
    @Transactional
    fun cleanUpWithdrawnMembers() {
        val memberIds = memberRepository.findIdsDeletedBefore(clock.instant().minus(RETENTION))

        if (memberIds.isEmpty()) {
            return
        }

        val objectKeys = memberPhotoRepository.findAllByMemberIdIn(memberIds).map { it.objectKey }

        memberPhotoRepository.deleteAllByMemberIdIn(memberIds)
        nicknameHistoryRepository.deleteAllByMemberIdIn(memberIds)
        memberRepository.deleteAllByIdIn(memberIds)

        if (objectKeys.isNotEmpty()) {
            photoStorage.delete(objectKeys)
        }

        log.info { "탈퇴 회원 ${memberIds.size}명을 정리했다." }
    }

    companion object {

        val RETENTION: Duration = Duration.ofDays(90)

        private const val CLEAN_UP_CRON = "0 40 4 * * *"
        private const val KOREA = "Asia/Seoul"
    }
}
