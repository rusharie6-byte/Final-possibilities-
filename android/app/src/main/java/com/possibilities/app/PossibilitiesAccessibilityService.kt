package com.possibilities.app

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.Rect
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityWindowInfo
import org.json.JSONArray
import org.json.JSONObject

class PossibilitiesAccessibilityService : AccessibilityService() {

    companion object {
        var instance: PossibilitiesAccessibilityService? = null
            private set
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Event pipeline listener for state change interrupts
        // Safe bypass: ignore banking and sensitive application package state changes
        val pkg = event?.packageName?.toString()?.lowercase() ?: ""
        if (pkg.contains("bank") || pkg.contains("standardbank")) {
            return
        }
    }

    override fun onInterrupt() {
        instance = null
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    /**
     * Traverses multi-window active screen surface and compiles structural node JSON map.
     */
    fun captureActiveSurfaceMap(): String {
        val surfaceArray = JSONArray()

        try {
            val windowsList = windows
            if (windowsList != null && windowsList.isNotEmpty()) {
                for (window in windowsList) {
                    val windowObject = JSONObject()
                    windowObject.put("windowId", window.id)
                    windowObject.put("type", window.type)
                    windowObject.put("isFocused", window.isFocused)
                    windowObject.put("isActive", window.isActive)

                    val rootNode = window.root
                    val nodesArray = JSONArray()
                    if (rootNode != null) {
                        traverseNode(rootNode, nodesArray)
                        rootNode.recycle()
                    }
                    windowObject.put("nodes", nodesArray)
                    surfaceArray.put(windowObject)
                }
            } else {
                // Fallback to active root window if multi-window array is unavailable
                val rootNode = rootInActiveWindow
                if (rootNode != null) {
                    val windowObject = JSONObject()
                    windowObject.put("windowId", 0)
                    val nodesArray = JSONArray()
                    traverseNode(rootNode, nodesArray)
                    rootNode.recycle()
                    windowObject.put("nodes", nodesArray)
                    surfaceArray.put(windowObject)
                } else {
                    return "{\"error\": \"No active surface or window root accessible.\"}"
                }
            }
        } catch (e: Exception) {
            return "{\"error\": \"${e.message ?: "Surface inspection exception"}\"}"
        }

        return surfaceArray.toString()
    }

    private fun traverseNode(node: AccessibilityNodeInfo?, nodesArray: JSONArray) {
        if (node == null) return

        try {
            if (node.text != null || node.contentDescription != null || node.isClickable || node.isEditable) {
                val bounds = Rect()
                node.getBoundsInScreen(bounds)

                val isPwd = node.isPassword
                val item = JSONObject()
                // Mask passwords to prevent bank security tripwires and credential leakage
                item.put("text", if (isPwd) "••••••" else (node.text?.toString() ?: ""))
                item.put("desc", if (isPwd) "Password Field" else (node.contentDescription?.toString() ?: ""))
                item.put("viewId", node.viewIdResourceName ?: "")
                item.put("class", node.className?.toString() ?: "")
                item.put("clickable", node.isClickable)
                item.put("editable", node.isEditable)
                item.put("bounds", JSONObject().apply {
                    put("left", bounds.left)
                    put("top", bounds.top)
                    put("right", bounds.right)
                    put("bottom", bounds.bottom)
                })
                nodesArray.put(item)
            }

            for (i in 0 until node.childCount) {
                val child = node.getChild(i)
                traverseNode(child, nodesArray)
                child?.recycle()
            }
        } catch (_: Exception) {
            // Gracefully ignore inaccessible or secured view nodes
        }
    }

    /**
     * Executes a native touch gesture at exact target screen (x, y) coordinates.
     */
    fun performTapGesture(x: Float, y: Float): Boolean {
        return try {
            val path = Path().apply {
                moveTo(x, y)
            }
            val stroke = GestureDescription.StrokeDescription(path, 0, 50)
            val gesture = GestureDescription.Builder().addStroke(stroke).build()
            dispatchGesture(gesture, null, null)
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Compatibility aliases for legacy calls
     */
    fun dumpScreenTree(): String = captureActiveSurfaceMap()
    fun tapCoordinates(x: Float, y: Float): Boolean = performTapGesture(x, y)
}
