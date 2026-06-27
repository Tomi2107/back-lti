<?php
defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Herramientas de Accesibilidad LTI';

// Settings
$string['settings_toolurl']          = 'URL de la herramienta';
$string['settings_toolurl_desc']     = 'URL base del backend LTI de accesibilidad (ej. https://a11y.tuservidor.com).';
$string['settings_sharedsecret']     = 'Secreto compartido';
$string['settings_sharedsecret_desc'] = 'Clave HMAC-SHA256 para firmar los tokens JWT entre Moodle y el backend. Debe coincidir con MOODLE_SHARED_SECRET en el .env del backend.';
$string['settings_servicetoken']     = 'Token del servicio web';
$string['settings_servicetoken_desc'] = 'Token de un servicio web de Moodle con permisos para leer contenido y progreso del curso (core_course_get_contents, core_completion_get_activities_completion_status).';
