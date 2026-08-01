package com.blueoauld.server.domain.feed.dto.request

import com.blueoauld.server.domain.feed.entity.FeedPost
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class CreateFeedPostRequest(

    @field:NotBlank(message = "사진 정보가 올바르지 않습니다.")
    val objectKey: String,

    @field:Size(max = FeedPost.CAPTION_MAX_LENGTH, message = "문구가 너무 깁니다.")
    val caption: String? = null,
)
