package com.blueoauld.server.domain.report.event

data class ReportPhotosCopiedEvent(

    val reportId: Long,
    val copies: List<PhotoCopy>,
)

data class PhotoCopy(

    val sourceKey: String,
    val targetKey: String,
)
