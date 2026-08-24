package com.blueoauld.server.domain.member.entity.type

import java.util.*

enum class MemberLocale(

    val javaLocale: Locale,
) {

    KO(Locale.KOREAN),
    JA(Locale.JAPANESE),
    EN(Locale.ENGLISH),
    ZH_TW(Locale.TRADITIONAL_CHINESE),
}
