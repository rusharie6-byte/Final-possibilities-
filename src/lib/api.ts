@@
     const clone = response.clone();
-    let bodyText = '';
-    try {
-      bodyText = await clone.text();
-    } catch (e) {
-      bodyText = '[Unreadable body stream]';
-    }
+    let bodyText = '';
+    try {
+      const raw = await clone.text();
+      // Truncate large bodies to avoid main-thread memory spikes in the UI
+      bodyText = raw.length > 50_000 ? raw.substring(0, 50_000) + '...[truncated]' : raw;
+    } catch (e) {
+      bodyText = '[Unreadable body stream]';
+    }
@@
-    console.log(
-      `[NETWORK RESPONSE] URL: ${urlString} | Status: ${response.status} ${response.statusText} | Body: ${
-        bodyText.length > 500 ? bodyText.substring(0, 500) + '...' : bodyText
-      }`
-    );
+    console.log(
+      `[NETWORK RESPONSE] URL: ${urlString} | Status: ${response.status} ${response.statusText} | Body: ${
+        bodyText.length > 500 ? bodyText.substring(0, 500) + '...' : bodyText
+      }`
+    );
***
