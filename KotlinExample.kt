import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

fun sendToCollectEndpoint() {
    val client = OkHttpClient()
    
    // JSON structure that your endpoint expects
    val jsonPayload = JSONObject().apply {
        // Optional: request_details object
        put("request_details", JSONObject().apply {
            put("client_info", "My Kotlin App v1.0")
            put("platform", "Android")
        })
        
        // Required: payload object with source and summary
        put("payload", JSONObject().apply {
            put("source", "kotlin-app")           // REQUIRED
            put("summary", "Test data submission") // REQUIRED
            put("additional_data", "any other data you want to send")
            put("timestamp", System.currentTimeMillis())
        })
    }
    
    val mediaType = "application/json; charset=utf-8".toMediaType()
    val requestBody = jsonPayload.toString().toRequestBody(mediaType)
    
    val request = Request.Builder()
        .url("https://your-cloudflare-worker.your-domain.workers.dev/api/collect")
        .post(requestBody)
        .addHeader("Authorization", "Bearer YOUR_AUTH_TOKEN_HERE") // REQUIRED
        .addHeader("Content-Type", "application/json")
        .build()
    
    try {
        val response = client.newCall(request).execute()
        println("Response code: ${response.code}")
        println("Response body: ${response.body?.string()}")
    } catch (e: Exception) {
        println("Error: ${e.message}")
    }
}

// Minimal example - just the required fields
fun sendMinimalExample() {
    val client = OkHttpClient()
    
    // Absolute minimum JSON structure
    val minimalJson = """
    {
        "payload": {
            "source": "kotlin-debug",
            "summary": "Testing connection"
        }
    }
    """.trimIndent()
    
    val mediaType = "application/json; charset=utf-8".toMediaType()
    val requestBody = minimalJson.toRequestBody(mediaType)
    
    val request = Request.Builder()
        .url("https://your-worker-url/api/collect")
        .post(requestBody)
        .addHeader("Authorization", "Bearer YOUR_AUTH_TOKEN")
        .build()
    
    client.newCall(request).execute().use { response ->
        println("Status: ${response.code}")
        if (!response.isSuccessful) {
            println("Error body: ${response.body?.string()}")
        }
    }
} 