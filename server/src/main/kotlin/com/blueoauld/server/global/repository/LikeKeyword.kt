package com.blueoauld.server.global.repository

fun String.escapeLike() = replace("""\""", """\\""")
    .replace("%", """\%""")
    .replace("_", """\_""")
