<?
/**
 * Wrapper for cdx api with caching
 */

// ini_set("display_errors","On"); // DEBUG
// ini_set("log_errors","On"); // DEBUG
// error_reporting(E_STRICT | E_ALL); // DEBUG

$recache = isset($_GET['recache']);

$cache_dir = '/tmp/cdx_cache/'; // trailing slash
if (!file_exists($cache_dir))
  mkdir($cache_dir);

$params = $_GET;
$cdx = 'http://web.archive.org/cdx/search/cdx?';
$api_url = $cdx . http_build_query($params);

$cache_path = $cache_dir . base64_encode($api_url);
if (!$recache && file_exists($cache_path)) {
  $raw_response = file_get_contents($cache_path);
} else {
  $raw_response = file_get_contents($api_url);
  file_put_contents($cache_path, $raw_response);
}

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Credentials: true");
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Max-Age: 1000');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token , Authorization');
header('Content-Type: application/json');

echo $raw_response;
