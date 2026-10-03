<?php
require_once __DIR__ . '/config.php';

class EvolutionAPI {
    /**
     * Sends an automated WhatsApp message using Evolution API.
     * 
     * @param string $type The category of message (out_for_delivery, delivered, new_order_owner)
     * @param string $rawMobile The target phone number (from DB)
     * @param string $orderId The order ID to inject
     * @param string|null $totalPrice Optional total price for new order messages
     */
    public static function sendOrderMessage($type, $rawMobile, $orderId, $totalPrice = null) {
        if (!defined('EVO_API_BASE') || !EVO_API_KEY) {
            return false;
        }

        // Clean mobile number (strip non-digits)
        $mobile = preg_replace('/[^0-9]/', '', $rawMobile);
        if (strlen($mobile) == 10) {
            $mobile = '91' . $mobile;
        }

        // Load templates
        $jsonPath = realpath(__DIR__ . '/../../message_order_templates.json');
        
        if (!$jsonPath || !file_exists($jsonPath)) {
            error_log("EvolutionAPI Error: Templates file not found.");
            return false;
        }

        $templates = json_decode(file_get_contents($jsonPath), true);
        if (!isset($templates[$type]) || empty($templates[$type])) {
            error_log("EvolutionAPI Error: Template type '$type' not found.");
            return false;
        }

        // Select random template
        $template = $templates[$type][array_rand($templates[$type])];

        // Replace placeholders
        $text = str_replace('{order_id}', $orderId, $template);
        $text = str_replace('{store_name}', $orderId, $text);
        if ($totalPrice !== null) {
            $text = str_replace('{total_price}', $totalPrice, $text);
        }

        // API Endpoint
        $url = rtrim(EVO_API_BASE, '/') . '/message/sendText/' . EVO_API_INSTANCE;

        $payload = [
            "number" => $mobile,
            "text" => $text,
            "options" => [
                "delay" => 1200, // Adds a slight typing delay simulation
                "presence" => "composing",
                "linkPreview" => false
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'apikey: ' . EVO_API_KEY
        ]);

        $response = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            error_log("EvolutionAPI Error: " . $err);
            return false;
        }
        
        return json_decode($response, true);
    }
}
?>
