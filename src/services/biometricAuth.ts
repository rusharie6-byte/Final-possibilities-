import { NativeBiometric } from "@capgo/capacitor-native-biometric";

export async function authenticateAuthority(): Promise<boolean> {
  try {
    const result = await NativeBiometric.isAvailable();
    if (!result.isAvailable) {
      return confirm("Biometric sensor unavailable. Confirm manual approval as Authority?");
    }

    await NativeBiometric.verifyIdentity({
      reason: "Authorize Possibilities System Execution",
      title: "Authority Sign-Off",
      subtitle: "Fingerprint/Face Verification Required",
      description: "Confirming this action will grant runtime execution authority.",
    });

    return true;
  } catch (error) {
    console.error("Biometric Authentication Failed:", error);
    return false;
  }
}
