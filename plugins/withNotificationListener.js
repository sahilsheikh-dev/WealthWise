const { withAndroidManifest, withDangerousMod, withMainApplication } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE_NAME = 'com.begawo.WealthWise';
const SERVICE_CLASS = 'WealthWiseNotificationListenerService';
const MODULE_CLASS = 'WealthWiseNotificationListenerModule';
const PACKAGE_CLASS = 'WealthWiseNotificationListenerPackage';

const TRUSTED_PAYMENT_PACKAGES = [
  'com.google.android.apps.nbu.paisa.user',
  'com.phonepe.app',
  'net.one97.paytm',
  'in.org.npci.upiapp',
  'in.amazon.mShop.android.shopping',
  'com.dreamplug.androidapp',
  'money.jupiter',
  'com.epifi.paisa',
  'indwin.c3.shareapp',
  'com.google.android.apps.messaging',
  'com.samsung.android.messaging',
  'com.snapwork.hdfc',
  'com.csam.icici.bank.imobile',
  'com.sbi.lotusintouch',
  'com.axis.mobile',
  'com.msf.kbank.mobile',
];

const SERVICE_KT = `package ${PACKAGE_NAME}

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import org.json.JSONArray
import org.json.JSONObject

class ${SERVICE_CLASS} : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) return
    val pkg = sbn.packageName ?: return
    if (pkg == packageName) return
    val notification = sbn.notification ?: return
    if ((notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0) return
    if ((notification.flags and Notification.FLAG_ONGOING_EVENT) != 0) return

    val prefs = applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    if (!prefs.getBoolean(KEY_ENABLED, false)) return

    recordObservedApp(applicationContext, prefs, pkg)

    val allowedRaw = prefs.getString(KEY_ALLOWED_PACKAGES, "[]") ?: "[]"
    val allowed = JSONArray(allowedRaw)
    if (allowed.length() > 0) {
      var matched = false
      for (i in 0 until allowed.length()) {
        if (allowed.optString(i) == pkg) {
          matched = true
          break
        }
      }
      if (!matched) return
    }

    val extras = notification.extras ?: return
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim() ?: ""
    val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim()
      ?: extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.trim()
      ?: ""
    if (title.isEmpty() && text.isEmpty()) return

    val payload = JSONObject().apply {
      put("packageName", pkg)
      put("title", title)
      put("text", text)
      put("postedAtMs", sbn.postTime)
    }

    if (!${MODULE_CLASS}.emitIfActive(payload)) {
      enqueueEvent(prefs, payload)
      if (looksLikeTransactionCandidate(title, text)) {
        postGenericReviewNotification(applicationContext)
      }
    }
  }

  companion object {
    const val PREFS_NAME = "wealthwise_notification_listener"
    const val KEY_ENABLED = "enabled"
    const val KEY_ALLOWED_PACKAGES = "allowed_packages"
    const val KEY_QUEUE = "queued_events"
    const val KEY_OBSERVED_APPS = "observed_apps"
    private const val MAX_QUEUE_SIZE = 25
    private const val MAX_OBSERVED_APPS = 40
    private const val CHANNEL_ID = "transaction-drafts"
    private const val REVIEW_NOTIFICATION_ID = 35001
    private val CANDIDATE_REGEX = Regex("(?:₹|rs\\\\.?|inr|\\\\$|usd)\\\\s*[0-9]", RegexOption.IGNORE_CASE)
    private val IGNORE_REGEX = Regex("\\\\b(?:otp|one[- ]?time\\\\s+password|verification\\\\s+code|do\\\\s+not\\\\s+share)\\\\b", RegexOption.IGNORE_CASE)

    private fun recordObservedApp(context: Context, prefs: android.content.SharedPreferences, pkg: String) {
      val label = try {
        val pm = context.packageManager
        val info = pm.getApplicationInfo(pkg, 0)
        pm.getApplicationLabel(info).toString().trim().ifEmpty { pkg }
      } catch (_: Exception) {
        pkg
      }
      val raw = prefs.getString(KEY_OBSERVED_APPS, "[]") ?: "[]"
      val current = try { JSONArray(raw) } catch (_: Exception) { JSONArray() }
      val next = JSONArray()
      next.put(JSONObject().apply {
        put("packageName", pkg)
        put("label", label)
      })
      for (i in 0 until current.length()) {
        if (next.length() >= MAX_OBSERVED_APPS) break
        val obj = current.optJSONObject(i) ?: continue
        if (obj.optString("packageName") != pkg) next.put(obj)
      }
      prefs.edit().putString(KEY_OBSERVED_APPS, next.toString()).apply()
    }

    private fun looksLikeTransactionCandidate(title: String, text: String): Boolean {
      val combined = "$title $text"
      return CANDIDATE_REGEX.containsMatchIn(combined) && !IGNORE_REGEX.containsMatchIn(combined)
    }

    private fun enqueueEvent(prefs: android.content.SharedPreferences, item: JSONObject) {
      val currentRaw = prefs.getString(KEY_QUEUE, "[]") ?: "[]"
      val current = try { JSONArray(currentRaw) } catch (_: Exception) { JSONArray() }
      val next = JSONArray()
      val start = if (current.length() >= MAX_QUEUE_SIZE) current.length() - MAX_QUEUE_SIZE + 1 else 0
      for (i in start until current.length()) {
        next.put(current.get(i))
      }
      next.put(item)
      prefs.edit().putString(KEY_QUEUE, next.toString()).apply()
    }

    private fun postGenericReviewNotification(context: Context) {
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(
          CHANNEL_ID,
          "Transaction Drafts",
          NotificationManager.IMPORTANCE_DEFAULT,
        ).apply {
          description = "Privacy-safe alerts when a transaction draft is ready for review"
          lockscreenVisibility = Notification.VISIBILITY_PRIVATE
        }
        manager.createNotificationChannel(channel)
      }

      val reviewIntent = Intent(Intent.ACTION_VIEW, Uri.parse("wealthwise://transaction-form")).apply {
        setPackage(context.packageName)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      }
      val pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      val reviewPendingIntent = PendingIntent.getActivity(context, REVIEW_NOTIFICATION_ID, reviewIntent, pendingFlags)

      val notification = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(context.applicationInfo.icon)
        .setContentTitle("Wealth Wise")
        .setContentText("Transaction draft ready to review.")
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
        .setAutoCancel(true)
        .setContentIntent(reviewPendingIntent)
        .addAction(0, "Review", reviewPendingIntent)
        .build()

      try {
        manager.notify(REVIEW_NOTIFICATION_ID, notification)
      } catch (_: SecurityException) {
        // Notification permission not granted; draft remains queued for in-app review.
      }
    }
  }
}
`;

const MODULE_KT = `package ${PACKAGE_NAME}

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class ${MODULE_CLASS}(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  init {
    activeContext = reactContext
  }

  override fun getName(): String = "WealthWiseNotificationListener"

  override fun invalidate() {
    super.invalidate()
    if (activeContext === reactContext) {
      activeContext = null
    }
  }

  @ReactMethod
  fun isPermissionGranted(promise: Promise) {
    try {
      val enabled = NotificationManagerCompat.getEnabledListenerPackages(reactContext)
        .contains(reactContext.packageName)
      promise.resolve(enabled)
    } catch (e: Exception) {
      promise.reject("E_PERMISSION_CHECK", e)
    }
  }

  @ReactMethod
  fun openNotificationAccessSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactContext.startActivity(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("E_OPEN_SETTINGS", e)
    }
  }

  @ReactMethod
  fun openAppInfoSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", reactContext.packageName, null)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactContext.startActivity(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("E_OPEN_APP_INFO", e)
    }
  }

  @ReactMethod
  fun setDetectionConfig(enabled: Boolean, allowedPackages: ReadableArray, promise: Promise) {
    try {
      val list = JSONArray()
      for (i in 0 until allowedPackages.size()) {
        val pkg = allowedPackages.getString(i)
        if (!pkg.isNullOrBlank()) list.put(pkg.trim())
      }
      val prefs = reactContext.getSharedPreferences(${SERVICE_CLASS}.PREFS_NAME, Context.MODE_PRIVATE)
      prefs.edit()
        .putBoolean(${SERVICE_CLASS}.KEY_ENABLED, enabled)
        .putString(${SERVICE_CLASS}.KEY_ALLOWED_PACKAGES, list.toString())
        .apply()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("E_SET_CONFIG", e)
    }
  }

  @ReactMethod
  fun drainQueuedEvents(promise: Promise) {
    try {
      val prefs = reactContext.getSharedPreferences(${SERVICE_CLASS}.PREFS_NAME, Context.MODE_PRIVATE)
      val raw = prefs.getString(${SERVICE_CLASS}.KEY_QUEUE, "[]") ?: "[]"
      prefs.edit().remove(${SERVICE_CLASS}.KEY_QUEUE).apply()
      val arr = try { JSONArray(raw) } catch (_: Exception) { JSONArray() }
      val result = Arguments.createArray()
      for (i in 0 until arr.length()) {
        val obj = arr.optJSONObject(i) ?: continue
        val map = Arguments.createMap().apply {
          putString("packageName", obj.optString("packageName"))
          putString("title", obj.optString("title"))
          putString("text", obj.optString("text"))
          putDouble("postedAtMs", obj.optDouble("postedAtMs"))
        }
        result.pushMap(map)
      }
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("E_DRAIN_QUEUE", e)
    }
  }

  @ReactMethod
  fun getEligibleSourceApps(promise: Promise) {
    try {
      val pm = reactContext.packageManager
      val installedTrusted = Arguments.createArray()
      val trustedCatalog = listOf(${TRUSTED_PAYMENT_PACKAGES.map((p) => `"${p}"`).join(', ')})
      for (pkg in trustedCatalog) {
        try {
          pm.getApplicationInfo(pkg, 0)
          installedTrusted.pushString(pkg)
        } catch (_: Exception) {
          // Package not installed on device
        }
      }
      val prefs = reactContext.getSharedPreferences(${SERVICE_CLASS}.PREFS_NAME, Context.MODE_PRIVATE)
      val raw = prefs.getString(${SERVICE_CLASS}.KEY_OBSERVED_APPS, "[]") ?: "[]"
      val arr = try { JSONArray(raw) } catch (_: Exception) { JSONArray() }
      val observedApps = Arguments.createArray()
      for (i in 0 until arr.length()) {
        val obj = arr.optJSONObject(i) ?: continue
        val pkg = obj.optString("packageName")
        if (pkg.isBlank()) continue
        observedApps.pushMap(Arguments.createMap().apply {
          putString("packageName", pkg)
          putString("label", obj.optString("label", pkg))
        })
      }
      val out = Arguments.createMap().apply {
        putArray("installedTrusted", installedTrusted)
        putArray("observedApps", observedApps)
      }
      promise.resolve(out)
    } catch (e: Exception) {
      promise.reject("E_ELIGIBLE_APPS", e)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {}

  @ReactMethod
  fun removeListeners(count: Int) {}

  companion object {
    @Volatile
    private var activeContext: ReactApplicationContext? = null

    fun emitIfActive(payload: JSONObject): Boolean {
      val ctx = activeContext ?: return false
      if (!ctx.hasActiveReactInstance()) return false
      val map = Arguments.createMap().apply {
        putString("packageName", payload.optString("packageName"))
        putString("title", payload.optString("title"))
        putString("text", payload.optString("text"))
        putDouble("postedAtMs", payload.optDouble("postedAtMs"))
      }
      ctx
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("WealthWiseNotificationDetected", map)
      return true
    }
  }
}
`;

const PACKAGE_KT = `package ${PACKAGE_NAME}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ${PACKAGE_CLASS} : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(${MODULE_CLASS}(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
`;

function withNotificationListener(config) {
  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest.queries = manifest.queries || [{}];
    const queriesBlock = manifest.queries[0];
    queriesBlock.package = queriesBlock.package || [];
    for (const pkg of TRUSTED_PAYMENT_PACKAGES) {
      if (!queriesBlock.package.some((entry) => entry.$?.['android:name'] === pkg)) {
        queriesBlock.package.push({ $: { 'android:name': pkg } });
      }
    }
    queriesBlock.intent = queriesBlock.intent || [];
    if (!queriesBlock.intent.some((entry) => entry.data?.[0]?.$?.['android:scheme'] === 'upi')) {
      queriesBlock.intent.push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        data: [{ $: { 'android:scheme': 'upi' } }],
      });
    }

    const app = manifest.application?.[0];
    if (!app) return mod;
    app.service = app.service || [];
    const fqcn = `${PACKAGE_NAME}.${SERVICE_CLASS}`;
    if (!app.service.some((s) => s.$?.['android:name'] === fqcn)) {
      app.service.push({
        $: {
          'android:name': fqcn,
          'android:label': 'WealthWise Transaction Detection',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
      });
    }
    return mod;
  });

  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const targetDir = path.join(
        mod.modRequest.platformProjectRoot,
        'app/src/main/java',
        ...PACKAGE_NAME.split('.'),
      );
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, `${SERVICE_CLASS}.kt`), SERVICE_KT, 'utf8');
      fs.writeFileSync(path.join(targetDir, `${MODULE_CLASS}.kt`), MODULE_KT, 'utf8');
      fs.writeFileSync(path.join(targetDir, `${PACKAGE_CLASS}.kt`), PACKAGE_KT, 'utf8');
      return mod;
    },
  ]);

  config = withMainApplication(config, (mod) => {
    const line = `add(${PACKAGE_CLASS}())`;
    if (!mod.modResults.contents.includes(line)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{/,
        `PackageList(this).packages.apply {\n              ${line}`,
      );
    }
    return mod;
  });

  return config;
}

module.exports = withNotificationListener;
