package expo.modules.fortomniahealth

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle

/**
 * Gives Health Connect a stable, non-authenticated destination for Fortomnia's
 * health-data rationale. The public policy remains available even when the
 * athlete is signed out or the React Native runtime has not started yet.
 */
class HealthPermissionsRationaleActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    startActivity(
      Intent(
        Intent.ACTION_VIEW,
        Uri.parse("https://fortomnia.com/privacy#health-data"),
      ),
    )
    finish()
  }
}
