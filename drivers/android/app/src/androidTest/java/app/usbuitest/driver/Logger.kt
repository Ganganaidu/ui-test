package app.usbuitest.driver

import android.util.Log

const val DEFAULT_TAG = "UsbUiTestAndroid"
fun debugLog(msg: String, tag: String = DEFAULT_TAG) {
    Log.d(tag, msg)
}

fun errorLog(msg: String, tag: String = DEFAULT_TAG) {
    Log.e(tag, msg)
}