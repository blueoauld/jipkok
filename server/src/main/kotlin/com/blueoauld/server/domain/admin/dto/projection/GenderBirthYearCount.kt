package com.blueoauld.server.domain.admin.dto.projection

interface GenderBirthYearCount {

    val gender: String
    val birthYear: Int
    val count: Long
}
