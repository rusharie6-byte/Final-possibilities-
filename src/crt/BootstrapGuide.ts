/**
 * BOOTSTRAP SCRIPT & ANDROID SHELL INTEGRATION GUIDE
 * Constitutional Root of Trust (CRT) v2.0
 */

export const BOOTSTRAP_SCRIPT_SHELL = `#!/bin/bash
# ==============================================================================
# CONSTITUTIONAL ROOT OF TRUST (CRT) v2.0 - OS BOOTSTRAPPER SCRIPT
# ==============================================================================

set -euo pipefail

CRT_BINARY="/usr/local/bin/possibilities-crt"
CONSTITUTION_PATH="/etc/possibilities/CONSTITUTION.md"
PUBLIC_KEY_PATH="/etc/possibilities/creator_public.key"

echo "[CRT BOOTSTRAP] Initializing OS Execution Chain..."

# 1. Verify CRT Binary Presence
if [ ! -f "$CRT_BINARY" ]; then
    echo "[CRITICAL ERROR] CRT Binary missing at $CRT_BINARY. System Halting."
    exit 1
fi

# 2. Execute CRT Bootloader Process
echo "[CRT BOOTSTRAP] Handing execution to CRT Native Supervisor..."
exec "$CRT_BINARY" --constitution="$CONSTITUTION_PATH" --key="$PUBLIC_KEY_PATH" "$@"
`;

export const ANDROID_SHELL_INTEGRATION_GUIDE = `
================================================================================
ANDROID SHELL INTEGRATION GUIDE (Capacitor / Android MainActivity)
================================================================================

1. Native Bootloader Hook (MainActivity.java)
--------------------------------------------------------------------------------
In \`android/app/src/main/java/com/possibilities/app/MainActivity.java\`:

\`\`\`java
package com.possibilities.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override:
    public void onCreate(Bundle savedInstanceState) {
        // 1. Initialize Native CRT Verification Engine BEFORE webview load
        boolean isCRTValid = NativeCRTBridge.verifyBootIntegrity(this);
        
        if (!isCRTValid) {
            // Immediately abort webview loading and display native restoration UI
            setContentView(R.layout.activity_restoration_mode);
            return;
        }

        super.onCreate(savedInstanceState);
    }
}
\`\`\`

2. Capacitor Bridge Native Plugin (\`NativeCRTPlugin.java\`)
--------------------------------------------------------------------------------
The bridge routes heartbeat checks and module capability manifests between the
web UI shell and the native Android CRT process.

3. Background Keep-Alive Daemon
--------------------------------------------------------------------------------
Android Foreground Service maintains the heartbeat listener. If the Capacitor
JS context crashes or fails attestation, the Foreground Service restarts the
shell under CRT supervision.
`;
