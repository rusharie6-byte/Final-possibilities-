package com.possibilities.app

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "AccessibilityControl")
class AccessibilityPlugin : Plugin() {

    @PluginMethod
    fun readScreen(call: PluginCall) {
        val service = PossibilitiesAccessibilityService.instance
        if (service == null) {
            call.reject("Accessibility Service not active in Android Settings.")
            return
        }
        val screenData = service.dumpScreenTree()
        call.resolve(com.getcapacitor.JSObject().put("screen", screenData))
    }

    @PluginMethod
    fun tapScreen(call: PluginCall) {
        val service = PossibilitiesAccessibilityService.instance
        if (service == null) {
            call.reject("Accessibility Service not active in Android Settings.")
            return
        }
        val x = call.getFloat("x") ?: 0f
        val y = call.getFloat("y") ?: 0f
        val success = service.tapCoordinates(x, y)
        call.resolve(com.getcapacitor.JSObject().put("success", success))
    }
}
