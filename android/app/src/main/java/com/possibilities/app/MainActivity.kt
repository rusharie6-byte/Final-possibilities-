package com.possibilities.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(AccessibilityPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
