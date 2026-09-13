package com.blueoauld.server.domain.appleads.service

import com.blueoauld.server.domain.appleads.dto.AppleAdsActionCommand
import com.blueoauld.server.domain.appleads.entity.AppleAdsAction
import com.blueoauld.server.domain.appleads.entity.type.AppleAdsActionType
import com.blueoauld.server.domain.appleads.repository.AppleAdsActionRepository
import com.blueoauld.server.global.exception.BusinessException
import com.blueoauld.server.global.exception.ErrorCode
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.time.Clock

@Service
class AppleAdsActionService(

    private val appleAdsClient: AppleAdsClient,
    private val actionRepository: AppleAdsActionRepository,
    private val clock: Clock,
) {

    fun apply(actorId: Long?, command: AppleAdsActionCommand, automatic: Boolean = false): AppleAdsAction {
        val actor = Actor(actorId, automatic)

        val action = when (command.type) {
            AppleAdsActionType.PAUSE_KEYWORD -> pauseKeyword(actor, command)
            AppleAdsActionType.LOWER_BID, AppleAdsActionType.RAISE_BID -> changeBid(actor, command)
            AppleAdsActionType.ADD_NEGATIVE_KEYWORD -> addNegativeKeyword(actor, command)
            AppleAdsActionType.ADD_KEYWORD -> addKeyword(actor, command)
        }

        return actionRepository.save(action)
    }

    fun revert(actorId: Long, actionId: Long): AppleAdsAction {
        val action = actionRepository.findById(actionId).orElse(null)
            ?: throw BusinessException(ErrorCode.APPLE_ADS_ACTION_NOT_FOUND)

        if (action.reverted) {
            throw BusinessException(ErrorCode.APPLE_ADS_ACTION_ALREADY_REVERTED)
        }

        if (hasLaterAction(action)) {
            throw BusinessException(ErrorCode.APPLE_ADS_ACTION_SUPERSEDED)
        }

        when (action.type) {
            AppleAdsActionType.PAUSE_KEYWORD -> appleAdsClient.updateKeyword(
                keywordId = requireField(action.keywordId),
                status = action.previousStatus ?: ACTIVE,
                bid = null,
                currency = null,
            )

            AppleAdsActionType.LOWER_BID, AppleAdsActionType.RAISE_BID -> appleAdsClient.updateKeyword(
                keywordId = requireField(action.keywordId),
                status = null,
                bid = requireField(action.previousBid),
                currency = requireField(action.currency),
            )

            AppleAdsActionType.ADD_NEGATIVE_KEYWORD -> appleAdsClient.deleteNegativeKeyword(
                negativeKeywordId = requireField(action.negativeKeywordId),
            )

            AppleAdsActionType.ADD_KEYWORD -> appleAdsClient.deleteKeyword(
                keywordId = requireField(action.keywordId),
            )
        }

        action.revert(actorId, clock.instant())

        return actionRepository.save(action)
    }

    private fun hasLaterAction(action: AppleAdsAction): Boolean {
        val keywordId = action.keywordId
        val searchTerm = action.searchTerm

        val laterOnKeyword = keywordId != null &&
            actionRepository.existsByIdGreaterThanAndKeywordIdAndRevertedAtIsNull(action.id, keywordId)
        val laterOnSearchTerm = searchTerm != null &&
            actionRepository.existsByIdGreaterThanAndAdGroupIdAndSearchTermAndRevertedAtIsNull(
                action.id,
                action.adGroupId,
                searchTerm,
            )

        return laterOnKeyword || laterOnSearchTerm
    }

    private fun pauseKeyword(actor: Actor, command: AppleAdsActionCommand): AppleAdsAction {
        val keywordId = requireField(command.keywordId)
        val current = appleAdsClient.findKeyword(keywordId)

        if (current.deleted || current.status != ACTIVE) {
            throw BusinessException(ErrorCode.APPLE_ADS_KEYWORD_CHANGED)
        }

        val updated = appleAdsClient.updateKeyword(
            keywordId = keywordId,
            status = PAUSED,
            bid = null,
            currency = null,
        )

        return action(
            actor = actor,
            command = command,
            keywordId = keywordId,
            keyword = command.keyword ?: updated.text,
            matchType = command.matchType ?: updated.matchType,
            previousStatus = ACTIVE,
            newStatus = updated.status ?: PAUSED,
        )
    }

    private fun changeBid(actor: Actor, command: AppleAdsActionCommand): AppleAdsAction {
        val keywordId = requireField(command.keywordId)
        val expectedBid = requireField(command.currentBid)
        val bid = requireField(command.suggestedBid)
        val currency = requireField(command.currency)
        val current = appleAdsClient.findKeyword(keywordId)
        val currentBid = current.bidAmount

        if (current.deleted || currentBid == null || currentBid.compareTo(expectedBid) != 0) {
            throw BusinessException(ErrorCode.APPLE_ADS_KEYWORD_CHANGED)
        }

        val updated = appleAdsClient.updateKeyword(
            keywordId = keywordId,
            status = null,
            bid = bid,
            currency = currency,
        )

        return action(
            actor = actor,
            command = command,
            keywordId = keywordId,
            keyword = command.keyword ?: updated.text,
            matchType = command.matchType ?: updated.matchType,
            previousBid = currentBid,
            newBid = updated.bidAmount ?: bid,
        )
    }

    private fun addNegativeKeyword(actor: Actor, command: AppleAdsActionCommand): AppleAdsAction {
        val searchTerm = requireSearchTerm(command)

        val created = appleAdsClient.createNegativeKeyword(
            adGroupId = command.adGroupId,
            text = searchTerm,
            matchType = EXACT,
        )

        return action(
            actor = actor,
            command = command,
            searchTerm = searchTerm,
            matchType = created.matchType ?: EXACT,
            negativeKeywordId = created.id,
        )
    }

    private fun addKeyword(actor: Actor, command: AppleAdsActionCommand): AppleAdsAction {
        val searchTerm = requireSearchTerm(command)
        val bid = requireField(command.suggestedBid)
        val currency = requireField(command.currency)

        val created = appleAdsClient.createKeyword(
            adGroupId = command.adGroupId,
            text = searchTerm,
            matchType = EXACT,
            bid = bid,
            currency = currency,
        )

        return action(
            actor = actor,
            command = command,
            keywordId = created.id,
            keyword = created.text,
            matchType = created.matchType ?: EXACT,
            searchTerm = searchTerm,
            newBid = created.bidAmount ?: bid,
            newStatus = created.status,
        )
    }

    private fun action(
        actor: Actor,
        command: AppleAdsActionCommand,
        keywordId: Long? = null,
        keyword: String? = null,
        matchType: String? = null,
        searchTerm: String? = null,
        negativeKeywordId: Long? = null,
        previousBid: BigDecimal? = null,
        newBid: BigDecimal? = null,
        previousStatus: String? = null,
        newStatus: String? = null,
    ) = AppleAdsAction(
        actorId = actor.id,
        automatic = actor.automatic,
        type = command.type,
        campaignId = command.campaignId,
        adGroupId = command.adGroupId,
        adGroupName = command.adGroupName,
        keywordId = keywordId,
        keyword = keyword,
        matchType = matchType,
        searchTerm = searchTerm,
        negativeKeywordId = negativeKeywordId,
        previousBid = previousBid,
        newBid = newBid,
        currency = command.currency,
        previousStatus = previousStatus,
        newStatus = newStatus,
        reason = command.reason?.take(AppleAdsAction.REASON_MAX_LENGTH),
    )

    private data class Actor(val id: Long?, val automatic: Boolean)

    private fun requireSearchTerm(command: AppleAdsActionCommand): String =
        requireField(command.searchTerm?.trim()?.takeIf { it.isNotEmpty() })

    private fun <T : Any> requireField(value: T?): T = value ?: throw BusinessException(ErrorCode.INVALID_REQUEST)

    companion object {

        private const val ACTIVE = "ACTIVE"
        private const val PAUSED = "PAUSED"
        private const val EXACT = "EXACT"
    }
}
