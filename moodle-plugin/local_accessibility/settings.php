<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_accessibility', get_string('pluginname', 'local_accessibility'));

    $settings->add(new admin_setting_configtext(
        'local_accessibility/toolurl',
        get_string('settings_toolurl', 'local_accessibility'),
        get_string('settings_toolurl_desc', 'local_accessibility'),
        '',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_accessibility/sharedsecret',
        get_string('settings_sharedsecret', 'local_accessibility'),
        get_string('settings_sharedsecret_desc', 'local_accessibility'),
        ''
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_accessibility/servicetoken',
        get_string('settings_servicetoken', 'local_accessibility'),
        get_string('settings_servicetoken_desc', 'local_accessibility'),
        ''
    ));

    $ADMIN->add('localplugins', $settings);
}
