<?php

namespace App\Modifiers;

use Statamic\Modifiers\Modifier;

class JsonLd extends Modifier
{
    // Like to_json, but keeps umlauts and slashes readable. JSON_HEX_TAG stops editor text from closing the <script>.
    public function index($value)
    {
        return json_encode((string) $value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);
    }
}
