blog.a-pro.ai
1. Navigate to the WordPress admin area.
2. Add CORS plugin
3. Add Polylang plugin
4. Add the following code to the end of the public_html/wp_content/themes/twentytwentyfive (replace with your active theme)/functions.php file to enable API lang support

```
// 🔹 Add Language Support for the REST API (Polylang)
function add_polylang_language_to_api($data, $post, $context) {
	$data->data['lang'] = pll_get_post_language($post->ID);
	return $data;
}
add_filter('rest_prepare_post', 'add_polylang_language_to_api', 10, 3);

// 🔹 Add Translations to API Response
function add_post_translations_to_api($data, $post, $context) {
	if (function_exists('pll_get_post_translations')) {
		$translations = pll_get_post_translations($post->ID);
		
		if ($translations) {
				foreach ($translations as $lang => $post_id) {
						$translations[$lang] = [
								'id' => $post_id,
								'slug' => get_post_field('post_name', $post_id) // Get slug
						];
				}
				$data->data['translations'] = $translations;
		}
}
return $data;
	// $translations = pll_get_post_translations($post->ID);
	// $data->data['translations'] = $translations;
	// return $data;

}
add_filter('rest_prepare_post', 'add_post_translations_to_api', 10, 3);

// 🔹 Enable CORS for API Requests (if needed)
function allow_rest_api_cors() {
	header("Access-Control-Allow-Origin: *");
	header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
	header("Access-Control-Allow-Headers: Content-Type, Authorization");
}
add_action('rest_api_init', 'allow_rest_api_cors', 15);
// 🔹 Add Language Param Support for the REST API (polylang)
function filter_rest_api_by_language($args, $request) {
	if (!is_admin() && isset($request['lang']) && function_exists('pll_get_post_language')) {
			$args['lang'] = sanitize_text_field($request['lang']);
	}
	return $args;
}
add_filter('rest_post_query', 'filter_rest_api_by_language', 10, 2);
```
