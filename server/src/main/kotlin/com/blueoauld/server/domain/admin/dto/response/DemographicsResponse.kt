package com.blueoauld.server.domain.admin.dto.response

data class DemographicsResponse(

    val male: Long,
    val female: Long,
    val ageGroups: List<AgeGroupResponse>,
)

data class AgeGroupResponse(

    val label: String,
    val male: Long,
    val female: Long,
)
