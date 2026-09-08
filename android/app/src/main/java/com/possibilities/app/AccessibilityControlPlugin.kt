package com.possibilities.app

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.JSObject

@CapacitorPlugin(name = "AccessibilityControl")
class AccessibilityControlPlugin : Plugin() {

    @PluginMethod
    fun checkStatus(call: PluginCall) {
        val service = PossibilitiesAccessibilityService.instance
        val ret = JSObject()
        ret.put("active", service != null)
        call.resolve(ret)
    }

    @PluginMethod
    fun readScreen(call: PluginCall) {
        val service = PossibilitiesAccessibilityService.instance
        if (service == null) {
            call.reject("Possibilities Accessibility Service is NOT enabled in Android Settings.")
            return
        }

        val screenText = service.captureActiveSurfaceMap()
        val result = JSObject()
        result.put("screen", screenText)
        call.resolve(result)
    }

    @PluginMethod
    fun tapScreen(call: PluginCall) {
        val service = PossibilitiesAccessibilityService.instance
        if (service == null) {
            call.reject("Possibilities Accessibility Service is NOT enabled in Android Settings.")
            return
        }

        val x = call.getDouble("x")?.toFloat()
        val y = call.getDouble("y")?.toFloat()

        if (x == null || y == null) {
            call.reject("Missing or invalid required parameters: x and y coordinates.")
            return
        }

        val success = service.performTapGesture(x, y)
        val result = JSObject()
        result.put("success", success)
        call.resolve(result)
    }
}
