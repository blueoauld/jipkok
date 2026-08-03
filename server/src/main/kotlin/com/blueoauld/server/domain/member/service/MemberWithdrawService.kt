package com.blueoauld.server.domain.member.service

import com.blueoauld.server.domain.block.repository.MemberBlockRepository
import com.blueoauld.server.domain.chat.repository.ChatRoomRepository
import com.blueoauld.server.domain.chat.service.ChatRoomService
import com.blueoauld.server.domain.favorite.repository.MemberFavoriteRepository
import com.blueoauld.server.domain.feed.repository.FeedPostLikeRepository
import com.blueoauld.server.domain.feed.repository.FeedPostRepository
import com.blueoauld.server.domain.like.repository.MemberLikeRepository
import com.blueoauld.server.domain.member.repository.MemberRepository
import com.blueoauld.server.domain.point.repository.PointHistoryRepository
import com.blueoauld.server.domain.push.repository.DeviceTokenRepository
import com.blueoauld.server.domain.secretphoto.repository.SecretPhotoAccessRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberWithdrawService(

    private val memberRepository: MemberRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomService: ChatRoomService,
    private val feedPostRepository: FeedPostRepository,
    private val feedPostLikeRepository: FeedPostLikeRepository,
    private val memberBlockRepository: MemberBlockRepository,
    private val memberFavoriteRepository: MemberFavoriteRepository,
    private val memberLikeRepository: MemberLikeRepository,
    private val secretPhotoAccessRepository: SecretPhotoAccessRepository,
    private val pointHistoryRepository: PointHistoryRepository,
    private val deviceTokenRepository: DeviceTokenRepository,
) {

    @Transactional
    fun withdraw(memberId: Long) {
        val member = memberRepository.findById(memberId)
            .orElseThrow { BusinessException(ErrorCode.MEMBER_NOT_FOUND) }

        leaveRooms(memberId)
        feedPostRepository.deleteAllByMemberId(memberId)
        feedPostLikeRepository.deleteAllByMemberId(memberId)
        memberBlockRepository.deleteAllByMember(memberId)
        memberFavoriteRepository.deleteAllByMember(memberId)
        memberLikeRepository.deleteAllByMember(memberId)
        secretPhotoAccessRepository.deleteAllByMember(memberId)
        pointHistoryRepository.deleteAllByMemberId(memberId)
        deviceTokenRepository.deleteAllByMemberId(memberId)

        memberRepository.delete(member)
    }

    private fun leaveRooms(memberId: Long) {
        chatRoomRepository.findAllByMember(memberId)
            .forEach { chatRoomService.delete(it, it.partnerIdOf(memberId)) }
    }
}
