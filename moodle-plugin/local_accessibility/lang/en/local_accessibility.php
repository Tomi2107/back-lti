<?php
defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Herramientas de Accesibilidad LTI';

// Etiquetas del título del campo
$string['settings_toolurl']           = 'https://back-lti.onrender.com';
$string['settings_sharedsecret']     = 'faro-secret-2026';
$string['settings_servicetoken']     = 'd1c9dfc7f790862a1474e57397303b09';

// Descripciones de ayuda que aparecen abajo de cada campo
$string['settings_toolurl_desc']     = 'Escriba la URL del backend alojado en Render (ej: https://back-lti.onrender.com).';
$string['settings_sharedsecret_desc'] = 'Clave segura utilizada para firmar los mensajes LTI entre Moodle y el backend.';
$string['settings_servicetoken_desc'] = 'Token REST de Moodle que permite al backend de Render consumir la API.';
