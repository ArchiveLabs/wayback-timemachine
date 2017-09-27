<?
/**
 * Basic endpoint to get an even sample set from cdx results
 */

$user_limit = $_GET['limit'] ? $_GET['limit'] : 25;
$params = $_GET;
$params['limit'] = 10000000; // 10 million to ensure full sample size
$cdx = 'http://web.archive.org/cdx/search/cdx?';
$api_url = $cdx . http_build_query($params);
$response = json_decode(file_get_contents($api_url));

// Get a sample set of data
$skip = floor(count($response) / $user_limit);
if ($skip == 0) $skip = 1;

// NOTE first element of array is header fields
$filtered = [$response[0]];
for ($i = 1; $i < count($response); $i += $skip) {
  $filtered[] = $response[$i];
}

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Credentials: true");
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token , Authorization');
header('Content-Type: application/json');
echo json_encode($filtered, JSON_PRETTY_PRINT);
