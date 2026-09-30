<?php

use Illuminate\Support\Facades\Route;

Route::statamic('sitemap.xml', 'sitemap', ['layout' => null, 'content_type' => 'xml']);
Route::statamic('llms.txt', 'llms', ['layout' => null, 'content_type' => 'text/plain; charset=utf-8']);
