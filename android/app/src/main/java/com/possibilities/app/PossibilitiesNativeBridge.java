package com.possibilities.app;

import android.content.Intent;
import android.os.BatteryManager;
import android.content.Context;
import android.content.IntentFilter;
import android.view.WindowManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PossibilitiesNativeBridge")
public class PossibilitiesNativeBridge extends Plugin {

    @PluginMethod
    public void getSystemCapabilities(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            Context context = getContext();
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = context.registerReceiver(null, ifilter);
            
            int level = batteryStatus != null ? batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) : -1;
            int scale = batteryStatus != null ? batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1) : -1;
            float batteryPct = level * 100 / (float) scale;

            ret.put("batteryLevel", (int) batteryPct);
            ret.put("isNativeBridgeActive", true);
            ret.put("handsFreeReady", true);
            ret.put("deepLinkScheme", "possibilities://listen");
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("isNativeBridgeActive", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void setKeepScreenOn(PluginCall call) {
        boolean enable = call.getBoolean("enable", true);
        getActivity().runOnUiThread(() -> {
            if (enable) {
                getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
            JSObject ret = new JSObject();
            ret.put("keepScreenOn", enable);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void notifyWakeWordTrigger(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("triggered", true);
        ret.put("timestamp", System.currentTimeMillis());
        notifyListeners("onWakeWordIntent", ret);
        call.resolve(ret);
    }
}
