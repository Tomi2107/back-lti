<?php
/**
 * Proxy de lanzamiento: Moodle valida la sesión y genera un token firmado
 * que permite al backend LTI identificar al usuario sin pasar por el flujo
 * OIDC completo desde el botón flotante.
 */
require_once(__DIR__ . '/../../config.php');
require_login();

$toolurl      = get_config('local_accessibility', 'toolurl');
$secret       = get_config('local_accessibility', 'sharedsecret');

if (empty($toolurl) || empty($secret)) {
    throw new moodle_exception('Plugin de accesibilidad no configurado.');
}

global $USER, $COURSE;

$payload = [
    'userId'      => (string) $USER->id,
    'userEmail'   => $USER->email,
    'userName'    => fullname($USER),
    'courseId'    => (string) $COURSE->id,
    'roles'       => local_accessibility_get_roles(),
    'moodleUrl'   => $CFG->wwwroot,
    'platformUrl' => $CFG->wwwroot,
    'iat'         => time(),
    'exp'         => time() + 3600, // válido 1 hora
];

$token = local_accessibility_sign_token($payload, $secret);

// Redirigir al backend con el token; el iframe cargará esto
$redirect = rtrim($toolurl, '/') . '/tool?token=' . urlencode($token);
redirect($redirect);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function local_accessibility_get_roles(): array {
    global $USER, $COURSE;
    $context = context_course::instance($COURSE->id);
    $roles   = get_user_roles($context, $USER->id, true);
    return array_values(array_map(fn($r) => $r->shortname, $roles));
}

function local_accessibility_sign_token(array $payload, string $secret): string {
    $header  = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body    = base64_encode(json_encode($payload));
    $sig     = hash_hmac('sha256', "$header.$body", $secret, true);
    $sigB64  = rtrim(strtr(base64_encode($sig), '+/', '-_'), '=');
    return "$header.$body.$sigB64";
}
