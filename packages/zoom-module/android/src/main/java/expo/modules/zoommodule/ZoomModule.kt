package expo.modules.zoommodule

import android.util.Log
import expo.modules.core.interfaces.Arguments
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import us.zoom.sdk.*;

class ZoomModule : Module(), ZoomSDKInitializeListener {
  override fun definition() = ModuleDefinition {
    Name("ZoomModule")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("hello") {
      "Hello world! 👋"
    }

    AsyncFunction("initialize") { jwt: String ->
      Log.d("ZOOM_MODULE", "inside initialize++ $jwt")
      Log.d("ZOOM_MODULE2", "hi")
      val sdk = ZoomSDK.getInstance();
      Log.d("ZOOM_MODULE2", "hi")
      val initParams = ZoomSDKInitParams().apply {
        jwtToken = jwt
        enableLog = true
        domain = "zoom.us"
      }
      Log.d("ZOOM_MODULE2", jwt)
      sdk.initialize(appContext.reactContext, this@ZoomModule, initParams)
      return@AsyncFunction jwt
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("joinMeeting"){zak: String, displayName: String, meetingNumber: String ->
      val sdk = ZoomSDK.getInstance();
      Log.d("ZOOM_NATIVE", "$zak $displayName $meetingNumber")
        if (!sdk.isInitialized) {
          return@AsyncFunction
        }
      Log.d("ZOOM_NATIVE", "We're socializing")

      val meetingService = sdk.meetingService
      Log.d("ZOOM_NATIVE", "MeetingService")

      val params = JoinMeetingParam4WithoutLogin().apply {
          this.displayName = displayName
          this.meetingNo = meetingNumber
          this.zoomAccessToken = zak
        }
      Log.d("ZOOM_NATIVE", "Params")

      val options = JoinMeetingOptions()
      Log.d("ZOOM_NATIVE", "options ${options.toString()}")
      val joinMeetingResult = meetingService.joinMeetingWithParams(appContext.reactContext, params, options)
      Log.d("ZOOM_NATIVE", "joinMeetingResult ${joinMeetingResult.toString()}")
//        if (joinMeetingResult != MeetingError.MEETING_ERROR_SUCCESS) {
//          Log.d("ZOOM_MEETING_ERROR", joinMeetingResult.toString())
//        }

    }.runOnQueue(Queues.MAIN)

    }

  override fun onZoomSDKInitializeResult(errorCode: Int, internalErrorCode: Int) {
    if (errorCode == ZoomError.ZOOM_ERROR_SUCCESS) {
      Log.d("ZOOM_INITIALIZE_SUCCESS", "Success!")
      val zoomSDK = ZoomSDK.getInstance()
      //zoomSDK.meetingService.addListener(this);
      // sendEvent("InitializeSucceeded");
    } else {
      Log.d("ZOOM_INITIALIZE_ERROR", errorCode.toString())
      // map.putString("errorReason", mapErrorCodeToErrorReason(errorCode));
      // sendEvent("InitializeFailed", map);
    }
  }

  override fun onZoomAuthIdentityExpired() {
    TODO("Not yet implemented")
  }

}


