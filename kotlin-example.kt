// Kotlin example for sending data to /api/collect endpoint

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString

// Data classes matching the expected JSON structure
@Serializable
data class Payload(
    val source: String,        // Required: identifies the source of the data
    val summary: String        // Required: summary of the data/event
)

@Serializable
data class RequestDetails(
    val client_version: String? = null,
    val platform: String? = null,
    val additional_info: String? = null
    // Add any other optional fields you want to include
)

@Serializable
data class CollectRequest(
    val payload: Payload,                    // Required
    val request_details: RequestDetails? = null  // Optional
)

fun main() {
    // Example 1: Minimal required data
    val minimalRequest = CollectRequest(
        payload = Payload(
            source = "android_app",
            summary = "User login successful"
        )
    )
    
    // Example 2: With optional request details
    val fullRequest = CollectRequest(
        payload = Payload(
            source = "android_app", 
            summary = "Security event detected"
        ),
        request_details = RequestDetails(
            client_version = "1.2.3",
            platform = "Android 13",
            additional_info = "Device model: Pixel 7"
        )
    )
    
    // Convert to JSON
    val json = Json { prettyPrint = true }
    println("Minimal JSON:")
    println(json.encodeToString(minimalRequest))
    println("\nFull JSON:")
    println(json.encodeToString(fullRequest))
    
    // Headers needed:
    println("\n=== REQUIRED HEADERS ===")
    println("Content-Type: application/json")
    println("Authorization: Bearer YOUR_AUTH_TOKEN_HERE")
    
    // HTTP method and endpoint
    println("\n=== REQUEST INFO ===")
    println("Method: POST")
    println("URL: https://your-cloudflare-worker-domain.com/api/collect")
}

/* 
Expected JSON output (minimal):
{
    "payload": {
        "source": "android_app",
        "summary": "User login successful"
    }
}

Expected JSON output (full):
{
    "payload": {
        "source": "android_app", 
        "summary": "Security event detected"
    },
    "request_details": {
        "client_version": "1.2.3",
        "platform": "Android 13", 
        "additional_info": "Device model: Pixel 7"
    }
}

HTTP Request Example:
POST /api/collect
Content-Type: application/json
Authorization: Bearer YOUR_AUTH_TOKEN_HERE

{
    "payload": {
        "source": "android_app",
        "summary": "User login successful"
    }
}
*/ 