package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.ai.repository.AiGreetingJobRepository
import com.blueoauld.server.domain.auth.repository.RefreshTokenRepository
import com.blueoauld.server.domain.block.repository.ContactBlockRepository
import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.service.ChatRoomService
import com.blueoauld.server.domain.diary.service.DiaryService
import com.blueoauld.server.domain.favorite.repository.MemberFavoriteRepository
import com.blueoauld.server.domain.feed.repository.FeedPostLikeRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.member.repository.getMember
import com.blueoauld.server.domain.memo.repository.MemberMemoRepository
import com.blueoauld.server.domain.point.repository.PointHistoryRepository
import com.blueoauld.server.domain.profileview.repository.ProfileViewRepository
import com.blueoauld.server.domain.push.repository.DeviceTokenRepository
import com.blueoauld.server.domain.secretphoto.repository.SecretPhotoAccessRepository
import com.blueoauld.server.domain.worry.repository.WorryCommentRepository
import com.blueoauld.server.domain.worry.repository.WorryPostLikeRepository
import com.blueoauld.server.domain.worry.repository.WorryPostRepository
import com.blueoauld.server.global.security.AccessTokenRevocationCache
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberWithdrawService(

    private val memberRepository: MemberRepository,
    private val aiGreetingJobRepository: AiGreetingJobRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomService: ChatRoomService,
    private val feedPostRepository: FeedPostRepository,
    private val feedPostLikeRepository: FeedPostLikeRepository,
    private val worryPostRepository: WorryPostRepository,
    private val worryPostLikeRepository: WorryPostLikeRepository,
    private val worryCommentRepository: WorryCommentRepository,
    private val diaryService: DiaryService,
    private val memberBlockRepository: MemberBlockRepository,
    private val contactBlockRepository: ContactBlockRepository,
    private val memberFavoriteRepository: MemberFavoriteRepository,
    private val memberLikeRepository: MemberLikeRepository,
    private val memberMemoRepository: MemberMemoRepository,
    private val secretPhotoAccessRepository: SecretPhotoAccessRepository,
    private val profileViewRepository: ProfileViewRepository,
    private val pointHistoryRepository: PointHistoryRepository,
    private val deviceTokenRepository: DeviceTokenRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val accessTokenRevocationCache: AccessTokenRevocationCache,
) {

    @Transactional
    fun withdraw(memberId: Long) {
        val member = memberRepository.getMember(memberId)

        leaveRooms(memberId)
        aiGreetingJobRepository.deleteAllByMemberId(memberId)
        feedPostRepository.deleteAllByMemberId(memberId)
        feedPostRepository.decreaseLikeCountLikedBy(memberId)
        feedPostLikeRepository.deleteAllByMemberId(memberId)
        worryPostRepository.deleteAllByMemberId(memberId)
        worryPostRepository.decreaseLikeCountLikedBy(memberId)
        worryPostLikeRepository.deleteAllByMemberId(memberId)
        worryPostRepository.decreaseCommentCountCommentedBy(memberId)
        worryCommentRepository.deleteAllByMemberId(memberId)
        diaryService.deleteAll(memberId)
        memberBlockRepository.deleteAllByMember(memberId)
        contactBlockRepository.deleteAllByMemberId(memberId)
        memberFavoriteRepository.deleteAllByMember(memberId)
        memberRepository.decreaseReceivedLikeCountLikedBy(memberId)
        memberLikeRepository.deleteAllByMember(memberId)
        memberMemoRepository.deleteAllByMember(memberId)
        secretPhotoAccessRepository.deleteAllByMember(memberId)
        profileViewRepository.deleteAllByMember(memberId)
        pointHistoryRepository.deleteAllByMemberId(memberId)
        deviceTokenRepository.deleteAllByMemberId(memberId)
        refreshTokenRepository.delete(memberId)
        accessTokenRevocationCache.revokeAll(memberId)

        memberRepository.delete(member)
    }

    private fun leaveRooms(memberId: Long) {
        chatRoomService.deleteAll(memberId, chatRoomRepository.findAllByMember(memberId))
    }
}
