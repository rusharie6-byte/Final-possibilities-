package com.possibilities.app

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.view.WindowManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "PossibilitiesNativeBridge")
class PossibilitiesNativeBridge : Plugin() {

    @PluginMethod
    fun getSystemCapabilities(call: PluginCall) {
        val ret = JSObject()
        try {
            val ctx: Context? = context
            val iFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatus: Intent? = ctx?.registerReceiver(null, iFilter)

            val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
            val batteryPct = if (scale > 0 && level >= 0) (level * 100 / scale.toFloat()).toInt() else -1

            ret.put("batteryLevel", batteryPct)
            ret.put("isNativeBridgeActive", true)
            ret.put("handsFreeReady", true)
            ret.put("deepLinkScheme", "possibilities://listen")
            call.resolve(ret)
        } catch (e: Exception) {
            ret.put("isNativeBridgeActive", false)
            ret.put("error", e.message ?: "Failed to read system capabilities")
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun setKeepScreenOn(call: PluginCall) {
        val enable = call.getBoolean("enable", true) ?: true
        activity.runOnUiThread {
            if (enable) {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            } else {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
            val ret = JSObject()
            ret.put("keepScreenOn", enable)
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun notifyWakeWordTrigger(call: PluginCall) {
        val ret = JSObject()
        ret.put("triggered", true)
        ret.put("timestamp", System.currentTimeMillis())
        notifyListeners("onWakeWordIntent", ret)
        call.resolve(ret)
    }
}
