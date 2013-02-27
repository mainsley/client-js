<?php

function sign($query) {
	$old_query = json_decode($query);
	// Take the input from the existing query but force the right connectors

	$new_query = array("connectorGuids" => array("79d826f8-f2ce-4267-bb2a-84fcda7a5c47"), "input" => array("location/street_address/postal_code/postal_code" => $old_query->input->{'location/street_address/postal_code/postal_code'}));

	$query = json_encode($new_query);

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
