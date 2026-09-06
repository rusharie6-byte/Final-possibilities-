package com.possibilities.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "AccessibilityControl")
class AccessibilityPlugin : Plugin() {

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
            call.reject("Accessibility Service not active in Android Settings.")
            return
        }
        val screenData = service.dumpScreenTree()
        val ret = JSObject()
        ret.put("screen", screenData)
        call.resolve(ret)
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
        val ret = JSObject()
        ret.put("success", success)
        call.resolve(ret)
    }
}
