package com.blueoauld.server.domain.photo.event

data class PhotosDeletedEvent(

    val objectKeys: List<String>,
)
