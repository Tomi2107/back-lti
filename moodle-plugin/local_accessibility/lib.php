<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Hook que Moodle llama antes del cierre del <body>.
 * Inyecta el botón flotante y el script bridge en todas las páginas.
 */
function local_accessibility_before_footer() {
    global $PAGE, $USER, $CFG;

    if (!isloggedin() || isguestuser()) {
        return;
    }

    $toolurl = get_config('local_accessibility', 'toolurl');
    if (empty($toolurl)) {
        return;
    }

    // URL del proxy de lanzamiento LTI dentro de este plugin
    $launchurl = $CFG->wwwroot . '/local/accessibility/launch.php';

    // Pasar configuración al módulo AMD
    $PAGE->requires->js_call_amd('local_accessibility/bridge', 'init', [
        [
            'launchUrl'  => $launchurl,
            'toolUrl'    => $toolurl,
        ]
    ]);
}
