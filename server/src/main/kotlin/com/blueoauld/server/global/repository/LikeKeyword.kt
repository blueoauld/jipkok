package com.blueoauld.server.global.repository

const val MIN_KEYWORD_LENGTH = 2

fun String.escapeLike() = replace("""\""", """\\""")
    .replace("%", """\%""")
    .replace("_", """\_""")
