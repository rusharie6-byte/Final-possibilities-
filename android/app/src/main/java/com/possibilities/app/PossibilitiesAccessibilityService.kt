package com.possibilities.app

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONArray
import org.json.JSONObject

class PossibilitiesAccessibilityService : AccessibilityService() {

    companion object {
        var instance: PossibilitiesAccessibilityService? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    fun dumpScreenTree(): String {
        val root = rootInActiveWindow ?: return "{\"error\": \"No active window\"}"
        val json = JSONObject()
        json.put("packageName", root.packageName ?: "")
        json.put("nodes", parseNode(root))
        return json.toString()
    }

    private fun parseNode(node: AccessibilityNodeInfo): JSONArray {
        val array = JSONArray()
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val item = JSONObject()
            item.put("text", child.text?.toString() ?: "")
            item.put("contentDescription", child.contentDescription?.toString() ?: "")
            item.put("viewId", child.viewIdResourceName ?: "")
            item.put("clickable", child.isClickable)
            
            val bounds = android.graphics.Rect()
            child.getBoundsInScreen(bounds)
            item.put("bounds", "${bounds.left},${bounds.top},${bounds.right},${bounds.bottom}")

            if (child.childCount > 0) {
                item.put("children", parseNode(child))
            }
            array.put(item)
        }
        return array
    }

    fun tapCoordinates(x: Float, y: Float): Boolean {
        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0, 100)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()
        return dispatchGesture(gesture, null, null)
    }
}
