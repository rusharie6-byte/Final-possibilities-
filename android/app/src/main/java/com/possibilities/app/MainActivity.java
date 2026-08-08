package com.possibilities.app;

import android.Manifest;
import android.app.AlertDialog;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private PermissionRequest pendingPermissionRequest;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PossibilitiesNativeBridge.class);
        super.onCreate(savedInstanceState);

        // Check startup permissions for Mic and Vault Storage Access
        checkAndRequestPermissions();

        // Configure WebView WebChromeClient for media capture
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        for (String resource : request.getResources()) {
                            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                                    request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                                    return;
                                } else {
                                    pendingPermissionRequest = request;
                                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.RECORD_AUDIO}, PERMISSION_REQUEST_CODE);
                                    return;
                                }
                            }
                        }
                        request.grant(request.getResources());
                    });
                }
            });
        }
    }

    private void checkAndRequestPermissions() {
        boolean micGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        boolean storageGranted = true;
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            storageGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
        }

        if (!micGranted || !storageGranted) {
            String[] permissionsToRequest;
            if (!micGranted && !storageGranted) {
                permissionsToRequest = new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE};
            } else if (!micGranted) {
                permissionsToRequest = new String[]{Manifest.permission.RECORD_AUDIO};
            } else {
                permissionsToRequest = new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE};
            }
            ActivityCompat.requestPermissions(this, permissionsToRequest, PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean storageDenied = false;
            for (int i = 0; i < permissions.length; i++) {
                if (Manifest.permission.WRITE_EXTERNAL_STORAGE.equals(permissions[i]) && grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                    storageDenied = true;
                }
            }

            if (pendingPermissionRequest != null) {
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    pendingPermissionRequest.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                } else {
                    pendingPermissionRequest.deny();
                }
                pendingPermissionRequest = null;
            }

            if (storageDenied) {
                new AlertDialog.Builder(this)
                        .setTitle("Vault Storage Permission Required")
                        .setMessage("Possibilities requires storage access for Zero-Knowledge Vault backups (/Documents/Possibilities/Vault/). Memory backups ensure data survival across uninstalls.")
                        .setPositiveButton("Grant Access", (dialog, which) -> checkAndRequestPermissions())
                        .setNegativeButton("Continue Limited", (dialog, which) -> dialog.dismiss())
                        .create()
                        .show();
            }
        }
    }
}

