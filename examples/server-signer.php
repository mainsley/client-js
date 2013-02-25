<?php

function sign($query) {

        $userGuid = "YOUR_USER_GUID";
        $apiKey = "YOUR_API_KEY";
        $orgGuid = "00000000-0000-0000-0000-000000000000";
        $expiry = (time() + (60*60*24)) * 1000; // This expires in 24 hours. Set this to $expiry = "null"; for no expiry

        $check = $query . ":" . $userGuid . ":" . $expiry;
        $digest = base64_encode(hash_hmac("sha1", $check, base64_decode($apiKey), true));

        $signedQuery = array("queryJson" => $query, "expiresAt" => $expiry, "userGuid" => $userGuid, "orgGuid" => $orgGuid, "digest" => $digest);
        return json_encode($signedQuery);

}

$signed = sign(file_get_contents('php://input'));

echo $signed;